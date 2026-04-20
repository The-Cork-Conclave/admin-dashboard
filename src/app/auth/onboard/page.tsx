'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import Logo from '@/components/logo'
import { Button } from '@/components/ui/button'

export default function OnboardPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const next = searchParams.get('next')?.trim() ?? ''

  const onboardUrl = useMemo(() => {
    if (!token) return null
    const safeNext = next.startsWith('/dashboard') ? next : undefined
    const sp = new URLSearchParams({ token })
    if (safeNext) sp.set('next', safeNext)
    return `/api/auth/onboard?${sp.toString()}`
  }, [token, next])

  useEffect(() => {
    if (!onboardUrl) return
    window.location.assign(onboardUrl)
  }, [onboardUrl])

  const hasToken = token.length > 0

  return (
    <div className="flex h-dvh">
      <div className="hidden bg-[#281121] lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <div className="mb-10">
              <Logo />
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-4 text-center">
            {!hasToken ? (
              <>
                <div className="font-medium tracking-tight">
                  Invalid invite link
                </div>
                <div className="mx-auto max-w-xl text-muted-foreground">
                  This link is missing a verification token. Ask for a new
                  invite link.
                </div>
                <Button asChild className="w-full">
                  <Link href="/auth/login">Go to login</Link>
                </Button>
              </>
            ) : (
              <>
                <div className="font-medium tracking-tight">
                  Completing your setup…
                </div>
                <div className="mx-auto max-w-xl text-muted-foreground">
                  If you’re not redirected automatically, continue below.
                </div>
                <Button asChild className="w-full" disabled={!onboardUrl}>
                  <a href={onboardUrl ?? '#'}>Continue</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
