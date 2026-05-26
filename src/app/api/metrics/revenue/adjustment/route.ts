import { type NextRequest, NextResponse } from "next/server";

import { fetchUpstream } from "@/app/api/_utils/upstream";

export async function PATCH(req: NextRequest) {
  const upstream = await fetchUpstream("/metrics/payments/adjustment", {
    method: "PATCH",
    body: await req.text(),
    headers: { "Content-Type": req.headers.get("Content-Type") ?? "application/json" },
  });

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
  });
}
