const rawBase = process.env.NEXT_PUBLIC_API_URL?.trim() ?? ''

export const API_BASE_URL = rawBase.replace(/\/$/, '')

export const apiPaths = {
  adminAuthSignin: '/admin/auth/signin',
  adminAuthSigninRequestLink: '/admin/auth/signin/request-link',
  adminsList: '/admins/',
  adminsAuthInvite: '/admins/auth/invite',
  events: '/events',
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
