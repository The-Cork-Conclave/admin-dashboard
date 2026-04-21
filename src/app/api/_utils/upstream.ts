import { cookies } from "next/headers";

import { AUTH_COOKIES, getApiBaseUrl } from "@/lib/constants/auth";

function cookieHeader(k: string, v: string): string {
  return `${k}=${encodeURIComponent(v)}`;
}

export async function fetchUpstream(path: string, init: RequestInit & { searchParams?: URLSearchParams } = {}) {
  const cookieStore = await cookies();
  const access = cookieStore.get(AUTH_COOKIES.accessToken)?.value?.trim() ?? "";

  const base = getApiBaseUrl();
  const url = new URL(`${base}${path.startsWith("/") ? path : `/${path}`}`);
  if (init.searchParams) {
    init.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", headers.get("Accept") ?? "application/json");
  if (access) headers.set("Cookie", cookieHeader(AUTH_COOKIES.accessToken, access));

  return fetch(url, {
    ...init,
    headers,
    cache: "no-store",
    redirect: "manual",
  });
}
