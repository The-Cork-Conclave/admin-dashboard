import { z } from "zod";

export const formSchema = z.object({
  access_code: z.string().min(1, { message: "Please enter an access code." }),
});

export type FormInput = z.infer<typeof formSchema>;

export type CheckinResponse = {
  name: string;
  ticket_id: string;
  checkin_at: string;
};
