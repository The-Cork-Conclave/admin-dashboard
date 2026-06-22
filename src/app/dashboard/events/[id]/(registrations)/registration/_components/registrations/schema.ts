import z from "zod";

const registrationQuestionResponseSchema = z.object({
  question_id: z.string(),
  question: z.string(),
  type: z.enum(["yes_no", "text", "single_choice", "multiple_choice"]),
  sort_order: z.number(),
  answer_text: z.string().optional(),
  answer_options: z.array(z.string()).optional(),
});

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
  responses: z.array(registrationQuestionResponseSchema).optional(),
});

export type RegistrationQuestionResponse = z.infer<typeof registrationQuestionResponseSchema>;
export type RegistrationRow = z.infer<typeof registrationSchema>;
