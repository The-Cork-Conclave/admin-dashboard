type RefreshResult = { ok: boolean };

let refreshInFlight: Promise<RefreshResult> | null = null;

async function refreshAccessTokenOnce(): Promise<RefreshResult> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
          headers: { Accept: "application/json" },
          cache: "no-store",
          redirect: "manual",
        });
        return { ok: res.ok };
      } catch {
        return { ok: false };
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

function toRequest(input: RequestInfo | URL, init?: RequestInit): Request {
  // Ensure we can retry even when input is a URL/string.
  return input instanceof Request ? input : new Request(input, init);
}

/**
 * `fetch` wrapper for the admin-dashboard browser that:
 * - always includes same-origin cookies (`credentials: "include"`)
 * - on 401, refreshes via `/api/auth/refresh` (once globally) and retries once
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const req1 = toRequest(input, init);
  const res1 = await fetch(req1, { credentials: "include" });
  if (res1.status !== 401) return res1;

  const refreshed = await refreshAccessTokenOnce();
  if (!refreshed.ok) return res1;

  // Important: requests/bodies are single-use; clone for retry.
  const req2 = req1.clone();
  return fetch(req2, { credentials: "include" });
}
