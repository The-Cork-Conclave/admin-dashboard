import { type NextRequest, NextResponse } from "next/server";

import { fetchUpstream } from "@/app/api/_utils/upstream";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Proxies admin SSE from the API so EventSource can use dashboard cookies. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const upstream = await fetchUpstream(`/events/${encodeURIComponent(id)}/stream`, {
    method: "GET",
    headers: { Accept: "text/event-stream" },
  });

  if (!upstream.ok || !upstream.body) {
    const body = await upstream.text().catch(() => "Upstream stream unavailable");
    return new NextResponse(body, {
      status: upstream.status || 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
