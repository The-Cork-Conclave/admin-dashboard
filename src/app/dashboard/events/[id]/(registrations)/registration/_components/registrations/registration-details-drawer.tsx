"use client";

import type * as React from "react";

import { CircleAlertIcon, CircleCheckIcon, Clock3Icon, LoaderIcon, UserRound, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

import {
  formatQuestionAnswer,
  formatRegistrationDate,
  formatRegistrationStatusLabel,
  getEffectiveRegistrationStatus,
} from "./registration-display";
import type { RegistrationRow } from "./schema";

export type RegistrationDetailsDrawerProps = {
  registration: RegistrationRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function statusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "confirmed":
      return <CircleCheckIcon className="fill-green-500 stroke-primary-foreground dark:fill-green-600" />;
    case "checked_in":
      return <CircleCheckIcon className="fill-primary stroke-primary-foreground" />;
    case "pending_payment":
      return <LoaderIcon />;
    case "cancelled":
      return <CircleAlertIcon className="text-amber-600 dark:text-amber-500" />;
    case "expired":
      return <Clock3Icon className="text-muted-foreground" />;
    default:
      return null;
  }
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-2 p-3 text-sm sm:grid-cols-3">
      <div className="text-muted-foreground sm:col-span-1">{label}</div>
      <div className="font-medium text-foreground sm:col-span-2">{value}</div>
    </div>
  );
}

export function RegistrationDetailsDrawer({ registration, open, onOpenChange }: RegistrationDetailsDrawerProps) {
  const effectiveStatus = registration ? getEffectiveRegistrationStatus(registration) : "";
  const responses = [...(registration?.responses ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="w-screen! sm:min-w-150 xl:min-w-125">
        <DrawerHeader className="border-b bg-muted/20 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted">
                  <UserRound className="size-5 text-muted-foreground" />
                </span>
                <div className="min-w-0">
                  <DrawerTitle className="truncate text-lg">{registration?.name ?? "Registration details"}</DrawerTitle>
                  <DrawerDescription className="truncate text-sm">{registration?.email ?? "—"}</DrawerDescription>
                </div>
              </div>
            </div>

            <DrawerClose asChild>
              <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0">
                <X className="size-4" />
                <span className="sr-only">Close drawer</span>
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Registration details</h3>
            <div className="overflow-hidden rounded-xl border bg-background">
              <DetailRow
                label="Status"
                value={
                  registration ? (
                    <Badge variant="outline" className="px-1.5 text-muted-foreground">
                      {statusIcon(effectiveStatus)}
                      {formatRegistrationStatusLabel(effectiveStatus)}
                    </Badge>
                  ) : (
                    "—"
                  )
                }
              />
              <div className="border-t" />
              <DetailRow label="Paid on" value={formatRegistrationDate(registration?.confirmed_at)} />
              <div className="border-t" />
              <DetailRow label="Registered on" value={formatRegistrationDate(registration?.created_at)} />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Registration questions</h3>
            {responses.length > 0 ? (
              <div className="overflow-hidden rounded-xl border bg-background">
                {responses.map((response, index) => (
                  <div key={response.question_id}>
                    {index > 0 ? <div className="border-t" /> : null}
                    <DetailRow label={response.question} value={formatQuestionAnswer(response)} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed bg-muted/20 p-4 text-muted-foreground text-sm">
                No registration questions were answered.
              </div>
            )}
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
