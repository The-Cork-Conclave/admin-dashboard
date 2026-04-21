export const AUTH_COOKIES = {
  accessToken: "cc_access_token",
  refreshToken: "cc_refresh_token",
} as const;

export function getApiBaseUrl(): string {
  const raw = process.env.API_URL?.trim() ?? "";
  const base = raw.replace(/\/$/, "");
  if (!base) throw new Error("Missing API_URL");
  return base;
}
