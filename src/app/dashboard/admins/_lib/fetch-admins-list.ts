import { authFetch } from "@/lib/auth/auth-fetch";

import { type AdminsListResponse, adminsListResponseSchema } from "../_components/schema";

export async function fetchAdminsList(page: number, perPage: number): Promise<AdminsListResponse> {
  const sp = new URLSearchParams();
  sp.set("page", String(page));
  sp.set("per_page", String(perPage));

  const res = await authFetch(`/api/admins?${sp.toString()}`, { method: "GET" });
  if (!res.ok) {
    let message = "Failed to load admins";
    try {
      const body = (await res.json()) as { message?: string };
      if (typeof body.message === "string" && body.message.length > 0) {
        message = body.message;
      }
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const json: unknown = await res.json();
  return adminsListResponseSchema.parse(json);
}
