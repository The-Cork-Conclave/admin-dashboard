import { z } from "zod";
import { authFetch } from "@/lib/auth/auth-fetch";
import { jobSchema, listMetaSchema } from "./schema";

export const JobsListResponseSchema = z.object({
  data: z.array(jobSchema),
  meta: listMetaSchema,
});

export type JobsListResponse = z.infer<typeof JobsListResponseSchema>;
export type JobListItem = z.infer<typeof jobSchema>;

export async function retryJob(jobId: string): Promise<void> {
  const id = jobId.trim();
  if (!id) throw new Error("Missing job id");

  const res = await authFetch(`/api/jobs/${encodeURIComponent(id)}`, {
    method: "POST",
    headers: { Accept: "application/json" },
  });

  if (res.status === 204) return;

  let message = "Failed to retry job";
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

export async function fetchJobsList(args: {
  page: number;
  perPage: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "created_at" | "name";
  sortOrder?: "asc" | "desc";
}): Promise<JobsListResponse> {
  const sp = new URLSearchParams();
  sp.set("page", String(args.page));
  sp.set("per_page", String(args.perPage));

  if (args.status?.trim()) sp.set("status", args.status.trim());
  if (args.dateFrom?.trim()) sp.set("date_from", args.dateFrom.trim());
  if (args.dateTo?.trim()) sp.set("date_to", args.dateTo.trim());
  if (args.sortBy) sp.set("sort_by", args.sortBy);
  if (args.sortOrder) sp.set("sort_order", args.sortOrder);

  const res = await authFetch(`/api/jobs?${sp.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    let message = "Failed to load jobs";
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
  return JobsListResponseSchema.parse(json);
}
