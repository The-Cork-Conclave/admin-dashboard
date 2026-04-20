import { NextResponse, type NextRequest } from 'next/server'

import { getApiBaseUrl } from '@/lib/constants/auth'

export async function POST(req: NextRequest) {
  const body = (await req.json()) as unknown

  const upstream = await fetch(`${getApiBaseUrl()}/admin/auth/signin/request-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const text = await upstream.text()
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
  })
}

