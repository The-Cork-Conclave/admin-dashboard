import { type NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIES, getApiBaseUrl } from "@/lib/constants/auth";

function safeNextPath(value: string | null): string {
  if (!value) return "/dashboard";
  if (!value.startsWith("/")) return "/dashboard";
  if (!value.startsWith("/dashboard")) return "/dashboard";
  return value;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim() ?? "";
  const next = safeNextPath(req.nextUrl.searchParams.get("next"));

  if (!token) {
    return NextResponse.redirect(new URL(`/auth/login?error=magic_link_invalid`, req.url));
  }

  const upstreamUrl = new URL(`${getApiBaseUrl()}/admin/auth/signup`);
  upstreamUrl.searchParams.set("mode", "bff");

  const upstream = await fetch(upstreamUrl, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
    cache: "no-store",
    redirect: "manual",
  });

  if (upstream.status !== 201) {
    return NextResponse.redirect(new URL(`/auth/login?error=magic_link_invalid`, req.url));
  }

  const contentType = upstream.headers.get("Content-Type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.redirect(new URL(`/auth/login?error=magic_link_invalid`, req.url));
  }

  const data = (await upstream.json()) as { access_token?: string; refresh_token?: string };
  const access = data.access_token?.trim() ?? "";
  const refresh = data.refresh_token?.trim() ?? "";
  if (!access || !refresh) {
    return NextResponse.redirect(new URL(`/auth/login?error=magic_link_invalid`, req.url));
  }

  const res = NextResponse.redirect(new URL(next, req.url));
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
