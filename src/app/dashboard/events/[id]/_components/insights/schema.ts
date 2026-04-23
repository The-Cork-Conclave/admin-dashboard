import z from "zod";

export const activitySchema = z.object({
  id: z.string(),
  type: z.enum([
    "registration_created",
    "payment_successful",
    "payment_verification_failed",
    "ticket_issued",
    "check_in_completed",
  ]),
  title: z.string(),
  description: z.string().optional(),
  created_at: z.string(),
});

export type ActivityType =
  | "registration_created"
  | "payment_successful"
  | "payment_verification_failed"
  | "ticket_issued"
  | "check_in_completed";

export type Activity = z.infer<typeof activitySchema>;
