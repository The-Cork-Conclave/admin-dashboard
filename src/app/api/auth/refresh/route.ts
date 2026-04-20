import { NextResponse, type NextRequest } from 'next/server'

import { AUTH_COOKIES, getApiBaseUrl } from '@/lib/constants/auth'

function cookieHeader(k: string, v: string): string {
  return `${k}=${encodeURIComponent(v)}`
}

export async function POST(req: NextRequest) {
  const apiUrl = getApiBaseUrl()
  const refresh = req.cookies.get(AUTH_COOKIES.refreshToken)?.value?.trim() ?? ''
  if (!refresh) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(`${apiUrl}/admin/auth/refresh`)
  url.searchParams.set('mode', 'bff')
  const upstream = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Cookie: cookieHeader(AUTH_COOKIES.refreshToken, refresh),
    },
    cache: 'no-store',
    redirect: 'manual',
  })

  if (upstream.status !== 201) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const data = (await upstream.json()) as { access_token?: string }
  const access = data.access_token?.trim() ?? ''
  if (!access) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(AUTH_COOKIES.accessToken, access, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })
  return res
}

