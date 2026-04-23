import z from "zod";

export const registrationSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  user_id: z.string(),
  status: z.string(),
  confirmed_at: z.string().optional(),
  checked_in_at: z.string().nullable().optional(),
  created_at: z.string(),
  checked_in_count: z.number().optional(),
});

export type RegistrationRow = z.infer<typeof registrationSchema>;
