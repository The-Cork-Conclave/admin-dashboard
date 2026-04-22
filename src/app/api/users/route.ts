import { type NextRequest, NextResponse } from "next/server";
import { fetchUpstream } from "@/app/api/_utils/upstream";

export async function GET(req: NextRequest) {
  const upstream = await fetchUpstream("users", {
    method: "GET",
    searchParams: req.nextUrl.searchParams,
  });

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
  });
}
