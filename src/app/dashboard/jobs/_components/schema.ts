import z from "zod";

export const jobSchema = z.object({
  id: z.string(),
  name: z.enum([
    "send_event_registration_email",
    "send_event_reminder_3_days",
    "send_event_reminder_day_of",
    "verify_ercas_payment",
    "send_admin_magic_link_email",
    "send_admin_invite_email",
  ]),
  payload: z.any(),
  status: z.enum(["pending", "processing", "completed", "failed", "cancelled"]),
  attempts: z.number(),
  max_attempts: z.number(),
  run_at: z.string(),
  last_error: z.any().optional(),
  created_at: z.string(),
  processed_at: z.string().optional(),
});

export const listMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  per_page: z.number().int().min(1),
  total_pages: z.number().int().nonnegative(),
});

export type JobRow = z.infer<typeof jobSchema>;

export type JobStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

export type JobType =
  | "send_event_registration_email"
  | "send_event_reminder_3_days"
  | "send_event_reminder_day_of"
  | "verify_ercas_payment"
  | "send_admin_magic_link_email"
  | "send_admin_invite_email";
