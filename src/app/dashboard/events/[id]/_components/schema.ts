import z from "zod";

export const registrationSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  user_id: z.string(),
  status: z.string(),
  confirmed_at: z.string().optional(),
  created_at: z.string(),
});

export type RegistrationRow = z.infer<typeof registrationSchema>;
