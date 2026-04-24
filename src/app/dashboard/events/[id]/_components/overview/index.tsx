"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, FileText, MapPin, Server, Wallet, MoveRight } from "lucide-react";
import { type EventDTO, getEventClient } from "@/app/dashboard/events/[id]/_lib/get-event.client";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EventStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatNairaFromKobo } from "@/lib/utils";

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
  const imageUrl = useMemo(() => toExternalUrl(event?.image_url), [event?.image_url]);

  return (
    <main className="mx-auto w-full max-w-7xl p-6 md:p-10 lg:p-12">
      <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div className="min-w-0">
          <h1 className="mb-2 truncate font-semibold text-2xl tracking-tight">{event?.name ?? "Event"}</h1>

          {query.isLoading ? (
            <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-4" aria-hidden="true" />
                {formatDateTime(event?.event_date)}
              </span>
              <Separator orientation="vertical" className="h-4" />
              <EventStatusBadge status={event?.status ?? ""} />
            </div>
          )}
        </div>

        {!!event?.id && (
          <div className="flex gap-2">
            <Link href={`/dashboard/events/${event?.id ?? ""}/registration`}>
              <Button variant="default" size="sm">
                <span className="mr-2">Registration</span>
                <MoveRight />
              </Button>
            </Link>
          </div>
        )}
      </header>

      {query.isError ? (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Could not load event</AlertTitle>
          <AlertDescription>
            {query.error instanceof Error ? query.error.message : "Please try again."}
          </AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => query.refetch()}>
              Retry
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      <div className="group relative mb-6 h-48 w-full overflow-hidden rounded-2xl border bg-muted shadow-sm md:h-64">
        {imageUrl ? (
          <Link
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block h-full w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Open event banner image in a new tab"
            title="Open image in a new tab"
          >
            <Image
              src={imageUrl}
              alt="Event Banner"
              className="h-full w-full cursor-pointer object-cover transition-transform duration-700 group-hover:scale-105"
              fill
              sizes="(max-width: 768px) 100vw, 1024px"
              priority
            />
          </Link>
        ) : null}
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-foreground/10 ring-inset" />
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
                  <div className="space-y-2 sm:col-span-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-72" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
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
                    <dt className="mb-1 text-muted-foreground text-sm">Event Name</dt>
                    <dd className="font-medium text-sm">{event?.name ?? "—"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="mb-1 text-muted-foreground text-sm">Description</dt>
                    <dd className="text-sm leading-relaxed">{event?.description || "—"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="mb-1 text-muted-foreground text-sm">Dress Code</dt>
                    <dd className="text-sm leading-relaxed">{event?.dress_code || "—"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="mb-1 text-muted-foreground text-sm">Entry Fee</dt>
                    <dd className="text-sm leading-relaxed">{event?.entry_fee || "—"}</dd>
                  </div>
                  <div>
                    <dt className="mb-1 text-muted-foreground text-sm">Event Date</dt>
                    <dd className="font-medium text-sm">{formatDateTime(event?.event_date)}</dd>
                  </div>
                  <div>
                    <dt className="mb-1 text-muted-foreground text-sm">Status</dt>
                    <dd>
                      <EventStatusBadge status={event?.status ?? ""} />
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
                  <div className="space-y-2 sm:col-span-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-60" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              ) : (
                <dl className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="mb-1 text-muted-foreground text-sm">Venue Name</dt>
                    <dd className="font-medium text-sm">{event?.venue_name ?? "—"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="mb-1 text-muted-foreground text-sm">Venue Address</dt>
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
                  <dt className="mb-1 text-muted-foreground text-sm">Registration Fee</dt>
                  <dd className="mt-1 font-semibold text-2xl tracking-tight">{amount.pretty}</dd>
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
                    <dt className="mb-1 text-muted-foreground text-sm">Opens At</dt>
                    <dd className="font-medium text-sm">{formatDateTime(event?.registration_opens_at)}</dd>
                  </div>
                  <div>
                    <dt className="mb-1 text-muted-foreground text-sm">Closes At</dt>
                    <dd className="font-medium text-sm">{formatDateTime(event?.registration_closes_at)}</dd>
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
                    <dt className="mb-1 text-muted-foreground text-xs">Created At</dt>
                    <dd className="text-xs">{formatDateTime(event?.created_at)}</dd>
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
