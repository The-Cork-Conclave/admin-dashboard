import z from "zod";

export const membersSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string(),
  phone_number: z.string(),
  verified_at: z.string(),
  number_of_events: z.number().int().nonnegative().optional(),
  created_at: z.string(),
});

export type MembersRow = z.infer<typeof membersSchema>;
