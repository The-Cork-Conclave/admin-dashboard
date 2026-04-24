import { type NextRequest, NextResponse } from "next/server";
import { fetchUpstream } from "@/app/api/_utils/upstream";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const upstream = await fetchUpstream(`/jobs/${encodeURIComponent(id)}`, {
    method: "POST",
  });

  if (upstream.status === 204) return new NextResponse(null, { status: 204 });

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
  });
}
