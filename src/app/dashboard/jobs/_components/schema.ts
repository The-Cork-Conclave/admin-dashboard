import z from "zod";

export const jobSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  payload: z.any(),
  status: z.string().min(1),
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

export type JobStatus = JobRow["status"];
export type JobType = JobRow["name"];
