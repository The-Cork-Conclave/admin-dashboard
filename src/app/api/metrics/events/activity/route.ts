import { NextResponse } from "next/server";

import { fetchUpstream } from "@/app/api/_utils/upstream";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  const upstream = await fetchUpstream("/metrics/events/activity", {
    method: "GET",
    searchParams,
  });
  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
  });
}

