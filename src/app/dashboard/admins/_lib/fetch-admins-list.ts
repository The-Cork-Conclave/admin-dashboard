import { apiRoutes } from '@/lib/routes'

import { adminsListResponseSchema, type AdminsListResponse } from '../_components/schema'

export async function fetchAdminsList(page: number, perPage: number): Promise<AdminsListResponse> {
  const res = await fetch(apiRoutes.admins.list(page, perPage), {
    credentials: 'include',
  })
  if (!res.ok) {
    let message = 'Failed to load admins'
    try {
      const body = (await res.json()) as { message?: string }
      if (typeof body.message === 'string' && body.message.length > 0) {
        message = body.message
      }
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  const json: unknown = await res.json()
  return adminsListResponseSchema.parse(json)
}
