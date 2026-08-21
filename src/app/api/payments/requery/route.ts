import { type NextRequest, NextResponse } from "next/server";

import { fetchUpstream } from "@/app/api/_utils/upstream";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const upstream = await fetchUpstream("/payments/requery", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
  });
}
