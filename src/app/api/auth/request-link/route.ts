import { type NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIES, getApiBaseUrl } from "@/lib/constants/auth";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as unknown;

  const upstream = await fetch(`${getApiBaseUrl()}/admin/auth/signin/request-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (upstream.status === 201) {
    const data = (await upstream.json()) as {
      access_token?: string;
      refresh_token?: string;
    };
    const access = data.access_token?.trim() ?? "";
    const refresh = data.refresh_token?.trim() ?? "";
    if (!access || !refresh) {
      return NextResponse.json({ message: "Invalid Credentials" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true, authenticated: true }, { status: 200 });
    const secure = process.env.NODE_ENV === "production";
    res.cookies.set(AUTH_COOKIES.accessToken, access, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
    });
    res.cookies.set(AUTH_COOKIES.refreshToken, refresh, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
    });
    return res;
  }

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
  });
}
