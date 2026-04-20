"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, FileText, MapPin, Server, Wallet } from "lucide-react";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { getEventClient, type EventDTO } from "@/app/dashboard/events/[id]/_lib/get-event.client";

function formatDateTime(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function formatNairaFromKobo(koboString?: string): { pretty: string; raw: string } {
  const raw = (koboString ?? "").trim();
  const kobo = Number(raw);
  if (!raw || Number.isNaN(kobo)) return { pretty: "—", raw: raw || "—" };

  const naira = kobo / 100;
  const pretty = new Intl.NumberFormat(undefined, { style: "currency", currency: "NGN" }).format(naira);
  return { pretty, raw };
}

function statusBadgeVariant(status?: string): "default" | "secondary" | "destructive" | "outline" {
  const s = (status ?? "").toLowerCase();
  if (s === "active" || s === "open") return "default";
  if (s === "draft" || s === "pending") return "outline";
  if (s === "cancelled" || s === "canceled") return "destructive";
  if (s === "closed") return "secondary";
  return "outline";
}

function toExternalUrl(maybeUrl?: string): string | null {
  const v = (maybeUrl ?? "").trim();
  if (!v) return null;
  try {
    const u = new URL(v);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function EventDetailsClient({ id }: { id: string }) {
  const query = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEventClient(id),
    enabled: Boolean(id),
  });

  const event: EventDTO | undefined = query.data?.event;
  const amount = useMemo(() => formatNairaFromKobo(event?.amount_in_kobo), [event?.amount_in_kobo]);

  return (
    <main className="mx-auto w-full max-w-7xl p-6 md:p-10 lg:p-12">
      <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div className="min-w-0">
          <h1 className="mb-2 truncate text-2xl font-semibold tracking-tight">{event?.name ?? "Event"}</h1>

          {query.isLoading ? (
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-4" aria-hidden="true" />
                {formatDateTime(event?.event_date)}
              </span>
              <Separator orientation="vertical" className="h-4" />
              <Badge variant={statusBadgeVariant(event?.status)}>{event?.status ?? "Unknown"}</Badge>
            </div>
          )}
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
          <Button className="flex-1 md:flex-none" variant="destructive" disabled>
            Cancel Event
          </Button>
          <Button className="flex-1 md:flex-none" variant="outline" disabled>
            Close Event
          </Button>
          <Button className="w-full md:w-auto" disabled>
            Edit Event
          </Button>
        </div>
      </header>

      {query.isError ? (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Could not load event</AlertTitle>
          <AlertDescription>{query.error instanceof Error ? query.error.message : "Please try again."}</AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => query.refetch()}>
              Retry
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      <div className="group relative mb-6 h-48 w-full overflow-hidden rounded-2xl border bg-muted shadow-sm md:h-64">
        <Image
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=2000&h=600"
          alt="Event Banner"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          fill
          sizes="(max-width: 768px) 100vw, 1024px"
          priority
        />
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-foreground/10" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
                Event Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {query.isLoading ? (
                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-2 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-72" />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-14" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
              ) : (
                <dl className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="mb-1 text-sm text-muted-foreground">Event Name</dt>
                    <dd className="text-sm font-medium">{event?.name ?? "—"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="mb-1 text-sm text-muted-foreground">Description</dt>
                    <dd className="text-sm leading-relaxed">{event?.description || "—"}</dd>
                  </div>
                  <div>
                    <dt className="mb-1 text-sm text-muted-foreground">Event Date</dt>
                    <dd className="text-sm font-medium">{formatDateTime(event?.event_date)}</dd>
                  </div>
                  <div>
                    <dt className="mb-1 text-sm text-muted-foreground">Status</dt>
                    <dd>
                      <Badge variant={statusBadgeVariant(event?.status)}>{event?.status ?? "Unknown"}</Badge>
                    </dd>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground" aria-hidden="true" />
                Venue Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {query.isLoading ? (
                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-2 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-60" />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              ) : (
                <dl className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="mb-1 text-sm text-muted-foreground">Venue Name</dt>
                    <dd className="text-sm font-medium">{event?.venue_name ?? "—"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="mb-1 text-sm text-muted-foreground">Venue Address</dt>
                    <dd className="text-sm">
                      {(() => {
                        const text = event?.venue_address ?? "";
                        const href = toExternalUrl(text);
                        if (!text) return "—";
                        if (!href) return text;
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-4 hover:text-foreground"
                          >
                            {text}
                          </a>
                        );
                      })()}
                    </dd>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Wallet className="size-4 text-muted-foreground" aria-hidden="true" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {query.isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
              ) : (
                <>
                  <dt className="mb-1 text-sm text-muted-foreground">Registration Fee</dt>
                  <dd className="mt-1 text-2xl font-semibold tracking-tight">{amount.pretty}</dd>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
                Registration Window
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {query.isLoading ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-48" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-48" />
                  </div>
                </div>
              ) : (
                <dl className="space-y-5">
                  <div>
                    <dt className="mb-1 text-sm text-muted-foreground">Opens At</dt>
                    <dd className="text-sm font-medium">{formatDateTime(event?.registration_opens_at)}</dd>
                  </div>
                  <div>
                    <dt className="mb-1 text-sm text-muted-foreground">Closes At</dt>
                    <dd className="text-sm font-medium">{formatDateTime(event?.registration_closes_at)}</dd>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Server className="size-4 text-muted-foreground" aria-hidden="true" />
                System Info
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-muted/30 pt-2">
              {query.isLoading ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-14" />
                    <Skeleton className="h-6 w-44" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-36" />
                  </div>
                </div>
              ) : (
                <dl className="space-y-4">
                  <div>
                    <dt className="mb-1.5 text-xs text-muted-foreground">Slug</dt>
                    <dd>
                      <code className="rounded-md border bg-background px-2 py-1 font-mono text-xs text-muted-foreground">
                        {event?.slug ?? "—"}
                      </code>
                    </dd>
                  </div>
                  <div>
                    <dt className="mb-1 text-xs text-muted-foreground">Created At</dt>
                    <dd className="text-xs">{formatDateTime(event?.created_at)}</dd>
                  </div>
                  <div>
                    <dt className="mb-1 text-xs text-muted-foreground">Last Updated</dt>
                    <dd className="text-xs">—</dd>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

