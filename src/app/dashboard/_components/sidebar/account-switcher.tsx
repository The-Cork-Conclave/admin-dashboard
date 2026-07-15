"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { Bell, KeyRound, LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { bffRoutes } from "@/lib/bff-routes";
import { getInitials } from "@/lib/utils";

import { SetPasswordForm } from "./set-password-form";

type SessionUser = {
  name: string;
  email: string;
  isPasswordSet: boolean;
};

export function AccountSwitcher() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const router = useRouter();

  const initials = useMemo(() => getInitials(user?.name ?? "Admin"), [user?.name]);
  const passwordMode = user?.isPasswordSet ? "change" : "set";

  const loadSession = useCallback(async () => {
    const res = await fetch("/api/auth/session", { cache: "no-store" });
    if (!res.ok) {
      router.replace("/auth/login");
      router.refresh();
      return null;
    }
    const body = (await res.json()) as {
      name?: string;
      email?: string;
      is_password_set?: boolean;
    };
    return {
      name: body.name?.trim() || "Admin",
      email: body.email?.trim() || "",
      isPasswordSet: body.is_password_set === true,
    } satisfies SessionUser;
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await loadSession();
        if (cancelled || !next) return;
        setUser(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadSession]);

  const logout = async () => {
    try {
      await fetch(bffRoutes.adminAuth.logout(), { method: "POST" });
    } finally {
      router.replace("/auth/login");
      router.refresh();
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="size-8 cursor-pointer rounded-lg">
            <AvatarImage src={undefined} alt={user?.name ?? "Admin"} />
            <AvatarFallback className="rounded-lg bg-transparent text-primary">{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-72 space-y-1 rounded-lg" side="bottom" align="end" sideOffset={4}>
          <DropdownMenuItem className="p-0" disabled={loading}>
            <div className="flex w-full items-center justify-between gap-2 px-1 py-1.5">
              <Avatar className="size-9 rounded-lg">
                <AvatarImage src={undefined} alt={user?.name ?? "Admin"} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user?.name ?? "Admin"}</span>
                {user?.email ? <span className="truncate text-muted-foreground text-xs">{user.email}</span> : null}
              </div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem className="cursor-pointer">
              <Bell />
              Notifications
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              disabled={loading}
              onSelect={(e) => {
                e.preventDefault();
                setPasswordOpen(true);
              }}
            >
              <KeyRound />
              {user?.isPasswordSet ? "Change Password" : "Set Password"}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-destructive hover:text-destructive/80"
            onSelect={(e) => {
              e.preventDefault();
              void logout();
            }}
          >
            <LogOut />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="p-0 sm:max-w-md">
          <Card className="py-4 ring-0">
            <CardHeader className="border-b">
              <DialogHeader>
                <DialogTitle>{passwordMode === "set" ? "Set Password" : "Change Password"}</DialogTitle>
              </DialogHeader>
            </CardHeader>
            <CardContent className="py-4">
              <SetPasswordForm
                mode={passwordMode}
                onSuccess={async () => {
                  setPasswordOpen(false);
                  const next = await loadSession();
                  if (next) setUser(next);
                }}
              />
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
}
