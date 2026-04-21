import { NextResponse, type NextRequest } from 'next/server'

import { AUTH_COOKIES, getApiBaseUrl } from '@/lib/constants/auth'

function cookieHeader(k: string, v: string): string {
  return `${k}=${encodeURIComponent(v)}`
}

async function refreshAccessTokenFromCookies(refreshToken: string): Promise<string | null> {
  const apiUrl = getApiBaseUrl()
  const url = new URL(`${apiUrl}/admin/auth/refresh`)
  url.searchParams.set('mode', 'bff')

  const upstream = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Cookie: cookieHeader(AUTH_COOKIES.refreshToken, refreshToken),
    },
    cache: 'no-store',
    redirect: 'manual',
  })

  if (upstream.status !== 201) return null

  const data = (await upstream.json()) as { access_token?: string }
  const access = data.access_token?.trim() ?? ''
  return access.length > 0 ? access : null
}

function isPublicAssetPath(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.startsWith('/assets/')
  )
}

function buildNextParam(req: NextRequest): string {
  const pathname = req.nextUrl.pathname
  const search = req.nextUrl.search
  return `${pathname}${search}`
}

function safeNextPath(value: string): string {
  if (!value.startsWith('/')) return '/dashboard'
  if (!value.startsWith('/dashboard')) return '/dashboard'
  return value
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (isPublicAssetPath(pathname)) {
    return NextResponse.next()
  }

  const isAuthRoute = pathname === '/auth' || pathname.startsWith('/auth/')
  const isDashboardRoute = pathname === '/dashboard' || pathname.startsWith('/dashboard/')

  if (!isAuthRoute && !isDashboardRoute) {
    return NextResponse.next()
  }

  const access = req.cookies.get(AUTH_COOKIES.accessToken)?.value?.trim() ?? ''
  const refresh = req.cookies.get(AUTH_COOKIES.refreshToken)?.value?.trim() ?? ''
  const hasAccessToken = Boolean(access)
  const hasRefreshToken = Boolean(refresh)

  // Logged-in users should not see auth pages
  if (isAuthRoute && (hasAccessToken || hasRefreshToken)) {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Logged-out users should not see dashboard pages
  if (isDashboardRoute && !hasAccessToken) {
    // If the access token expired but refresh is still valid, refresh before redirecting.
    // Otherwise users get "logged out" on navigation even though they can still recover via /api/auth/session.
    if (hasRefreshToken) {
      return (async () => {
        try {
          const newAccess = await refreshAccessTokenFromCookies(refresh)
          if (!newAccess) {
            const url = req.nextUrl.clone()
            url.pathname = '/auth/login'
            url.searchParams.set('next', safeNextPath(buildNextParam(req)))
            return NextResponse.redirect(url)
          }

          const res = NextResponse.next()
          res.cookies.set(AUTH_COOKIES.accessToken, newAccess, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          })
          return res
        } catch {
          const url = req.nextUrl.clone()
          url.pathname = '/auth/login'
          url.searchParams.set('next', safeNextPath(buildNextParam(req)))
          return NextResponse.redirect(url)
        }
      })()
    }

    const url = req.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('next', safeNextPath(buildNextParam(req)))
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api).*)'],
}

