import z from 'zod'

export const eventSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  event_date: z.string(),
  venue_name: z.string(),
  venue_address: z.string(),
  amount_in_kobo: z.string(),
  status: z.string(),
  registration_opens_at: z.string(),
  registration_closes_at: z.string(),
  created_at: z.string(),
  created_by: z.string().optional(),
  updated_at: z.string().optional(),
  image_url: z.string().optional(),
})

export type EventRow = z.infer<typeof eventSchema>
