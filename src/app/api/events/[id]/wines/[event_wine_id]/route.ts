import { type NextRequest, NextResponse } from "next/server";

import { fetchUpstream } from "@/app/api/_utils/upstream";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string; event_wine_id: string }> }) {
  const { id, event_wine_id } = await ctx.params;
  const upstream = await fetchUpstream(`/events/${encodeURIComponent(id)}/wines/${encodeURIComponent(event_wine_id)}`, {
    method: "GET",
  });

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
  });
}
