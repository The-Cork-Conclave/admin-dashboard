import z from "zod";

export const activitySchema = z.object({
  id: z.string(),
  type: z.string().min(1),
  title: z.string(),
  description: z.string().optional(),
  created_at: z.string(),
});

export type Activity = z.infer<typeof activitySchema>;

export type ActivityType = Activity["type"];
