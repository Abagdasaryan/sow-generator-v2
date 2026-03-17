import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { generateDocx } from "@/lib/docx";
import type { ParsedSow } from "@/lib/types";

function getConvex() {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
}

/**
 * POST /api/export/docx
 *
 * Fetches the SOW from Convex, generates a DOCX document,
 * and returns it as a downloadable file.
 *
 * Body: { sowId: string }
 * Response: application/vnd.openxmlformats-officedocument.wordprocessingml.document
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

    // Generate the DOCX buffer
    const buffer = await generateDocx(sow);

    // Build a safe filename from the SOW title
    const safeTitle = sow.title
      .replace(/[^a-zA-Z0-9_\- ]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 80);
    const filename = `${safeTitle || "SOW"}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[/api/export/docx] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
