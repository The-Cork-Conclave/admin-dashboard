const rawBase = process.env.NEXT_PUBLIC_API_URL?.trim() ?? ''

export const API_BASE_URL = rawBase.replace(/\/$/, '')

export const apiPaths = {
  adminAuthSignin: '/admin/auth/signin',
  adminAuthSigninRequestLink: '/admin/auth/signin/request-link',
  adminsList: '/admins/',
  adminsAuthInvite: '/admins/auth/invite',
  events: '/events',
  eventsMetrics: '/events/metrics',
} as const

export const bffPaths = {
  adminAuthRequestLink: '/api/auth/request-link',
  adminAuthExchange: '/api/auth/exchange',
  adminAuthLogout: '/api/auth/logout',
} as const

export function getApiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${p}`
}

export const apiRoutes = {
  adminAuth: {
    signin: (token: string) => `${getApiUrl(apiPaths.adminAuthSignin)}?token=${encodeURIComponent(token)}`,
    signinRequestLink: () => getApiUrl(apiPaths.adminAuthSigninRequestLink),
  },
  admins: {
    list: (page: number, perPage: number) => {
      const base = getApiUrl(apiPaths.adminsList)
      const sep = base.includes('?') ? '&' : '?'
      return `${base}${sep}page=${encodeURIComponent(String(page))}&per_page=${encodeURIComponent(String(perPage))}`
    },
    invite: () => getApiUrl(apiPaths.adminsAuthInvite),
  },
  events: {
    create: () => getApiUrl(apiPaths.events),
    metrics: () => getApiUrl(apiPaths.eventsMetrics),
    list: (args?: {
      page?: number
      perPage?: number
      q?: string
      status?: string
      dateFrom?: string
      dateTo?: string
      sortBy?: 'created_at' | 'name'
      sortOrder?: 'asc' | 'desc'
    }) => {
      const base = getApiUrl(apiPaths.events)
      const sp = new URLSearchParams()

      const page = args?.page
      const perPage = args?.perPage
      const q = args?.q?.trim()
      const status = args?.status?.trim()
      const dateFrom = args?.dateFrom?.trim()
      const dateTo = args?.dateTo?.trim()
      const sortBy = args?.sortBy
      const sortOrder = args?.sortOrder

      if (typeof page === 'number' && Number.isFinite(page)) sp.set('page', String(page))
      if (typeof perPage === 'number' && Number.isFinite(perPage)) sp.set('per_page', String(perPage))
      if (q) sp.set('q', q)
      if (status) sp.set('status', status)
      if (dateFrom) sp.set('date_from', dateFrom)
      if (dateTo) sp.set('date_to', dateTo)
      if (sortBy) sp.set('sort_by', sortBy)
      if (sortOrder) sp.set('sort_order', sortOrder)

      const qs = sp.toString()
      return qs ? `${base}?${qs}` : base
    },
    byId: (id: string) => `${getApiUrl(apiPaths.events)}/${encodeURIComponent(id)}`,
  },
} as const

export const bffRoutes = {
  adminAuth: {
    requestLink: () => bffPaths.adminAuthRequestLink,
    exchange: (token: string, next?: string) => {
      const sp = new URLSearchParams({ token })
      if (typeof next === 'string' && next.length > 0) sp.set('next', next)
      return `${bffPaths.adminAuthExchange}?${sp.toString()}`
    },
    logout: () => bffPaths.adminAuthLogout,
  },
} as const
