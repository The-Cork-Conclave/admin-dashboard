import { NextResponse, type NextRequest } from 'next/server'

import { AUTH_COOKIES, getApiBaseUrl } from '@/lib/constants/auth'

function cookieHeader(k: string, v: string): string {
  return `${k}=${encodeURIComponent(v)}`
}

async function fetchSession(apiUrl: string, accessToken: string) {
  return fetch(`${apiUrl}/admin/auth/session`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Cookie: cookieHeader(AUTH_COOKIES.accessToken, accessToken),
    },
    cache: 'no-store',
    redirect: 'manual',
  })
}

async function refreshAccessToken(apiUrl: string, refreshToken: string) {
  const url = new URL(`${apiUrl}/admin/auth/refresh`)
  url.searchParams.set('mode', 'bff')
  return fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Cookie: cookieHeader(AUTH_COOKIES.refreshToken, refreshToken),
    },
    cache: 'no-store',
    redirect: 'manual',
  })
}

export async function GET(req: NextRequest) {
  const apiUrl = getApiBaseUrl()
  const access = req.cookies.get(AUTH_COOKIES.accessToken)?.value?.trim() ?? ''
  const refresh = req.cookies.get(AUTH_COOKIES.refreshToken)?.value?.trim() ?? ''

  if (!access) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  let res = await fetchSession(apiUrl, access)

  if (res.status === 401 && refresh) {
    const refreshRes = await refreshAccessToken(apiUrl, refresh)
    if (refreshRes.status === 201) {
      const data = (await refreshRes.json()) as { access_token?: string }
      const newAccess = data.access_token?.trim() ?? ''
      if (newAccess) {
        res = await fetchSession(apiUrl, newAccess)
        if (res.status === 200) {
          const body = await res.text()
          const out = new NextResponse(body, {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
          out.cookies.set(AUTH_COOKIES.accessToken, newAccess, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          })
          return out
        }
      }
    }
  }

  if (res.status !== 200) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const body = await res.text()
  return new NextResponse(body, { status: 200, headers: { 'Content-Type': 'application/json' } })
}

