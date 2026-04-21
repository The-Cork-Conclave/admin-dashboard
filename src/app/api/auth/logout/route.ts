import { type NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIES, getApiBaseUrl } from "@/lib/constants/auth";

export async function POST(_req: NextRequest) {
  // Best-effort upstream logout; ignore failures (cookie clearing is the key for the admin origin).
  try {
    await fetch(`${getApiBaseUrl()}/auth/logout`, { method: "POST", cache: "no-store" });
  } catch {
    // ignore
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIES.accessToken, "", { httpOnly: true, path: "/", maxAge: 0 });
  res.cookies.set(AUTH_COOKIES.refreshToken, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
