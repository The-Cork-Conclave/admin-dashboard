import { NextResponse, type NextRequest } from 'next/server'

import { AUTH_COOKIES } from '@/lib/constants/auth'

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

  const hasAccessToken = Boolean(req.cookies.get(AUTH_COOKIES.accessToken)?.value?.trim())

  // Logged-in users should not see auth pages
  if (isAuthRoute && hasAccessToken) {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Logged-out users should not see dashboard pages
  if (isDashboardRoute && !hasAccessToken) {
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

