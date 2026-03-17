import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  buildExecutiveSummaryPrompt,
  buildScopeNarrativesPrompt,
  buildArchitecturePrompt,
  buildDeliverablesPrompt,
} from "@/lib/prompts";
import type {
  GeneratedContent,
  ParsedSow,
} from "@/lib/types";

function getConvex() {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
}
function getAnthropic() {
  return new Anthropic();
}

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const SYSTEM_PROMPT =
  "You are a senior enterprise integration architect writing professional Statement of Work documents. Write in third person, formal but clear tone. Be specific about the technologies and systems mentioned. Do not invent details not provided in the input data.";

const VALID_SECTIONS = [
  "executive_summary",
  "scope_narratives",
  "architecture_description",
  "deliverables_prose",
] as const;

type SectionName = (typeof VALID_SECTIONS)[number];

/**
 * Call Claude API via the official SDK.
 */
async function callClaude(
  userPrompt: string,
  temperature: number = 0.3,
  maxTokens: number = 4096
): Promise<string> {
  const anthropic = getAnthropic();
  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
    temperature,
    max_tokens: maxTokens,
  });

  const textBlock = message.content.find((c) => c.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude API returned no text content");
  }
  return textBlock.text;
}

/**
 * Build the prompt for a given section name.
 */
function buildPromptForSection(sow: ParsedSow, section: SectionName): string {
  switch (section) {
    case "executive_summary":
      return buildExecutiveSummaryPrompt(
        sow.clientInfo,
        sow.integrationDetails,
        sow.scopeDeliverables,
        sow.pricingTerms
      );
    case "scope_narratives":
      return buildScopeNarrativesPrompt(sow.integrationDetails);
    case "architecture_description":
      return buildArchitecturePrompt(sow.integrationDetails);
    case "deliverables_prose":
      return buildDeliverablesPrompt(sow.scopeDeliverables);
    default:
      throw new Error(`Unknown section: ${section}`);
  }
}

/**
 * Parse a scope_narratives response, which should be JSON.
 * Falls back gracefully if the model returns non-JSON.
 */
function parseScopeNarratives(raw: string): Record<string, string> {
  try {
    return JSON.parse(raw);
  } catch {
    // Try to extract JSON from the response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // fall through
      }
    }
    // Fallback: wrap entire response under a single key
    return { "Scope Narrative": raw };
  }
}

/**
 * POST /api/generate
 *
 * Supports two modes:
 *
 * 1. Multi-section generation:
 *    Body: { sowId: string, sections: string[] }
 *    Generates content for all requested sections in parallel.
 *
 * 2. Single-section regeneration (with optional guidance):
 *    Body: { sowId: string, section: string, guidance?: string }
 *    Regenerates a single section with optional user guidance.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sowId } = body;

    if (!sowId) {
      return NextResponse.json(
        { error: "Missing required field: sowId" },
        { status: 400 }
      );
    }

    // Fetch the SOW from Convex
    const convex = getConvex();
    let sow: ParsedSow;
    try {
      sow = await convex.query(api.sows.get, {
        id: sowId as Id<"sows">,
      }) as ParsedSow;
    } catch (err) {
      const message = err instanceof Error ? err.message : "SOW not found";
      return NextResponse.json({ error: message }, { status: 404 });
    }

    // Determine mode: single section or multi-section
    if (body.section && typeof body.section === "string") {
      // --- Single section regeneration ---
      const section = body.section as SectionName;
      const guidance: string | undefined = body.guidance;

      if (!VALID_SECTIONS.includes(section)) {
        return NextResponse.json(
          {
            error: `Invalid section: ${section}. Valid sections: ${VALID_SECTIONS.join(", ")}`,
          },
          { status: 400 }
        );
      }

      let prompt = buildPromptForSection(sow, section);
      if (guidance) {
        prompt += `\n\nADDITIONAL GUIDANCE FROM THE USER:\n${guidance}`;
      }

      const raw = await callClaude(prompt);

      // Build the updated value for this section
      let sectionValue: string | Record<string, string>;
      if (section === "scope_narratives") {
        sectionValue = parseScopeNarratives(raw);
      } else {
        sectionValue = raw;
      }

      // Merge with existing generated content
      const mergedContent: GeneratedContent = {
        ...(sow.generatedContent || {
          executive_summary: "",
          scope_narratives: {},
          architecture_description: "",
          deliverables_prose: "",
        }),
        [section]: sectionValue,
      };

      // Save back to Convex
      await convex.mutation(api.sows.update, {
        id: sowId as Id<"sows">,
        generatedContent: mergedContent,
      });

      return NextResponse.json({
        section,
        content: sectionValue,
        generatedContent: mergedContent,
      });
    } else if (body.sections && Array.isArray(body.sections)) {
      // --- Multi-section generation ---
      const requestedSections = body.sections as string[];
      const invalidSections = requestedSections.filter(
        (s) => !VALID_SECTIONS.includes(s as SectionName)
      );
      if (invalidSections.length > 0) {
        return NextResponse.json(
          {
            error: `Invalid sections: ${invalidSections.join(", ")}. Valid sections: ${VALID_SECTIONS.join(", ")}`,
          },
          { status: 400 }
        );
      }

      const result: Partial<GeneratedContent> = {};
      const tasks: Promise<void>[] = [];

      for (const section of requestedSections as SectionName[]) {
        tasks.push(
          (async () => {
            const prompt = buildPromptForSection(sow, section);
            const raw = await callClaude(prompt);

            if (section === "scope_narratives") {
              result.scope_narratives = parseScopeNarratives(raw);
            } else {
              (result as Record<string, unknown>)[section] = raw;
            }
          })()
        );
      }

      await Promise.all(tasks);

      // Merge with existing generated content
      const existingContent: GeneratedContent = sow.generatedContent || {
        executive_summary: "",
        scope_narratives: {},
        architecture_description: "",
        deliverables_prose: "",
      };

      const mergedContent: GeneratedContent = {
        ...existingContent,
        ...result,
      };

      // Save back to Convex
      await convex.mutation(api.sows.update, {
        id: sowId as Id<"sows">,
        generatedContent: mergedContent,
      });

      return NextResponse.json({
        sections: requestedSections,
        generatedContent: mergedContent,
      });
    } else {
      return NextResponse.json(
        {
          error:
            "Request must include either 'sections' (array) for multi-section generation or 'section' (string) for single-section regeneration.",
        },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("[/api/generate] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
