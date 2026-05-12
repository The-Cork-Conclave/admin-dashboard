import { type NextRequest, NextResponse } from "next/server";

import { fetchUpstream } from "@/app/api/_utils/upstream";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const upstream = await fetchUpstream(`/events/${encodeURIComponent(id)}/gallery`, {
    method: "GET",
    searchParams: req.nextUrl.searchParams,
  });

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
  });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const upstream = await fetchUpstream(`/events/${encodeURIComponent(id)}/gallery`, {
    method: "POST",
    headers: { "Content-Type": req.headers.get("Content-Type") ?? "application/json" },
    body: await req.text(),
  });

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
  });
}

