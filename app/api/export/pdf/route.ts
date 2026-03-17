import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { renderSowHtml } from "@/lib/sow-html";
import type { ParsedSow } from "@/lib/types";

async function getConvex() {
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  const { getToken } = await auth();
  const token = await getToken({ template: "convex" });
  if (token) convex.setAuth(token);
  return convex;
}

/**
 * POST /api/export/pdf
 *
 * Fetches the SOW from Convex, renders it as print-optimized HTML,
 * and returns the HTML document. The client can use window.print()
 * or the browser's built-in print-to-PDF for conversion.
 *
 * Body: { sowId: string }
 * Response: text/html with Content-Disposition attachment header
 */
/**
 * GET /api/export/pdf?sowId=xxx&preview=true
 * Returns rendered HTML for in-browser preview.
 */
export async function GET(request: NextRequest) {
  try {
    const sowId = request.nextUrl.searchParams.get("sowId");
    if (!sowId) {
      return NextResponse.json({ error: "Missing sowId" }, { status: 400 });
    }

    const convex = await getConvex();
    const sow = await convex.query(api.sows.get, {
      id: sowId as Id<"sows">,
    }) as ParsedSow;

    if (!sow) {
      return NextResponse.json({ error: "SOW not found" }, { status: 404 });
    }

    const html = renderSowHtml(sow);
    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error("[/api/export/pdf GET] Error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
    const convex = await getConvex();
    const sow = await convex.query(api.sows.get, {
      id: sowId as Id<"sows">,
    }) as ParsedSow | null;

    if (!sow) {
      return NextResponse.json({ error: "SOW not found or unauthorized" }, { status: 404 });
    }

    // Render to print-optimized HTML
    const html = renderSowHtml(sow);

    // Build a safe filename from the SOW title
    const safeTitle = sow.title
      .replace(/[^a-zA-Z0-9_\- ]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 80);
    const filename = `${safeTitle || "SOW"}.html`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[/api/export/pdf] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
