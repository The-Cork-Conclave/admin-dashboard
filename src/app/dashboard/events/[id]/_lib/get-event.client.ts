'use client'

import { z } from 'zod'

import { apiRoutes } from '@/lib/routes'

export const eventDTOSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
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
  image_url: z.string(),
})

export type EventDTO = z.infer<typeof eventDTOSchema>

const getEventResponseSchema = z.object({ event: eventDTOSchema })

export type GetEventResponse = z.infer<typeof getEventResponseSchema>

export async function getEventClient(id: string): Promise<GetEventResponse> {
  const res = await fetch(apiRoutes.events.byId(id), {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) {
    let message = 'Could not load event. Please try again.'
    try {
      const body = (await res.json()) as { message?: string }
      if (typeof body.message === 'string' && body.message.length > 0)
        message = body.message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  const json = (await res.json()) as unknown
  return getEventResponseSchema.parse(json)
}
