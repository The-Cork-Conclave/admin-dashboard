'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Bell, LogOut } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { bffRoutes } from '@/lib/routes'
import { getInitials } from '@/lib/utils'

type SessionUser = {
  name: string
  email: string
}

export function AccountSwitcher() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const initials = useMemo(() => getInitials(user?.name ?? 'Admin'), [
    user?.name,
  ])

  useEffect(() => {
    let cancelled = false
      ; (async () => {
        try {
          const res = await fetch('/api/auth/session', { cache: 'no-store' })
          if (!res.ok) {
            router.replace('/auth/login')
            router.refresh()
            return
          }
          const body = (await res.json()) as { name?: string; email?: string }
          if (cancelled) return
          setUser({
            name: body.name?.trim() || 'Admin',
            email: body.email?.trim() || '',
          })
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    return () => {
      cancelled = true
    }
  }, [router])

  const logout = async () => {
    try {
      await fetch(bffRoutes.adminAuth.logout(), { method: 'POST' })
    } finally {
      router.replace('/auth/login')
      router.refresh()
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-8 rounded-lg cursor-pointer">
          <AvatarImage src={undefined} alt={user?.name ?? 'Admin'} />
          <AvatarFallback className="rounded-lg bg-transparent text-primary">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-72 space-y-1 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuItem className="p-0" disabled={loading}>
          <div className="flex w-full items-center justify-between gap-2 px-1 py-1.5">
            <Avatar className="size-9 rounded-lg">
              <AvatarImage src={undefined} alt={user?.name ?? 'Admin'} />
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {user?.name ?? 'Admin'}
              </span>
              {user?.email ? (
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              ) : null}
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer">
            <Bell />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive hover:text-destructive/80"
          onSelect={(e) => {
            e.preventDefault()
            void logout()
          }}
        >
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
