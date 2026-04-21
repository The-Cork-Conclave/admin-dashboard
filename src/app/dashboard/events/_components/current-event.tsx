'use client'

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, CheckCircle, SquarePen } from "lucide-react";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchEventsList } from "../_lib/fetch-events-list";
import { formatNairaFromKobo } from "@/lib/utils";



function formatDate(raw: string): string {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "MMM d, yyyy");
}

function formatTime(raw: string): string {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "h:mm a");
}

export default function CurrentEvent() {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const descriptionRef = React.useRef<HTMLParagraphElement | null>(null);
  const [canExpand, setCanExpand] = React.useState(false);

  const query = useQuery({
    queryKey: ["events", "active", 1, 1],
    queryFn: () =>
      fetchEventsList({
        page: 1,
        perPage: 1,
        status: "active",
        sortBy: "created_at",
        sortOrder: "desc",
      }),
  });

  const event = query.data?.data?.[0] ?? null;

  React.useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;

    const raf = window.requestAnimationFrame(() => {
      if (!event) {
        setCanExpand(false);
        setIsExpanded(false);
        return;
      }


      if (!isExpanded) {
        const nextCanExpand = el.scrollHeight > el.clientHeight + 1;
        setCanExpand(nextCanExpand);
      }
    });

    return () => window.cancelAnimationFrame(raf);
  }, [event, event?.description, isExpanded]);

  if (query.isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex flex-col gap-1 overflow-hidden rounded-2xl border border-border bg-card p-1.5 text-card-foreground shadow-sm md:flex-row">
          <div className="relative h-48 w-full shrink-0 md:h-auto md:w-1/3 lg:w-1/4">
            <Skeleton className="h-full w-full rounded-xl" />
          </div>

          <div className="flex flex-1 flex-col justify-between gap-6 p-5 md:p-6">
            <div>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="min-w-0 space-y-2">
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-4 w-full max-w-2xl" />
                  <Skeleton className="h-4 w-5/6 max-w-xl" />
                </div>
                <div className="space-y-1 text-left sm:text-right">
                  <Skeleton className="h-6 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-border border-y py-4 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-28" />
              <div className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!event) return null;

  const bannerUrl = event.image_url?.trim() ? event.image_url.trim() : "";

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1 overflow-hidden rounded-2xl border border-border bg-card p-1.5 text-card-foreground shadow-sm md:flex-row">
        <div className="relative h-48 w-full shrink-0 md:h-auto md:w-1/3 lg:w-1/4">
          <Image
            src={bannerUrl}
            alt="Active event banner"
            className="rounded-xl border border-border object-cover"
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            priority
          />
          <div className="absolute top-3 left-3">
            <Badge
              variant="outline"
              className="gap-1.5 rounded-md border-border bg-background/90 px-2 py-1 font-medium text-foreground text-xs shadow-sm backdrop-blur-sm"
            >
              <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-emerald-500" aria-hidden />
              Active
            </Badge>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between gap-6 p-5 md:p-6">
          <div>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground text-xl tracking-tight">{event.name}</h3>
                <p
                  ref={descriptionRef}
                  className={[
                    "mt-2 max-w-2xl text-muted-foreground text-sm leading-relaxed",
                    isExpanded ? "" : "line-clamp-3",
                  ].join(" ")}
                >
                  {event.description}
                </p>
                {canExpand ? (
                  <button
                    type="button"
                    className="mt-2 text-primary text-sm hover:underline"
                    onClick={() => setIsExpanded((v) => !v)}
                  >
                    {isExpanded ? "Show less" : "Show more"}
                  </button>
                ) : null}
              </div>
              <div className="text-left sm:text-right">
                <div className="font-semibold text-foreground text-lg tracking-tight">
                  {formatNairaFromKobo(event.amount_in_kobo).pretty}
                </div>
                <div className="mt-0.5 text-muted-foreground text-xs">Ticket Price</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-border border-y py-4 lg:grid-cols-4">
            <div>
              <p className="mb-1 font-medium text-muted-foreground text-xs">Event Date</p>
              <p className="text-foreground text-sm">{formatDate(event.event_date)}</p>
              <p className="mt-0.5 text-muted-foreground text-xs">{formatTime(event.event_date)}</p>
            </div>
            <div className="min-w-0">
              <p className="mb-1 font-medium text-muted-foreground text-xs">Venue Name</p>
              <p className="truncate text-foreground text-sm" title={event.venue_name}>
                {event.venue_name}
              </p>

            </div>
            <div>
              <p className="mb-1 font-medium text-muted-foreground text-xs">Registration Opens</p>
              <p className="text-foreground text-sm">{formatDate(event.registration_opens_at)}</p>
              <p className="mt-0.5 text-muted-foreground text-xs">{formatTime(event.registration_opens_at)}</p>
            </div>
            <div>
              <p className="mb-1 font-medium text-muted-foreground text-xs">Registration Closes</p>
              <p className="text-foreground text-sm">{formatDate(event.registration_closes_at)}</p>
              <p className="mt-0.5 text-muted-foreground text-xs">{formatTime(event.registration_closes_at)}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/dashboard/events/${encodeURIComponent(event.id)}`}>
              <Button
                type="button"
                className="gap-2"
              >
                <Eye className="size-4" aria-hidden />
                View Event
              </Button>
            </Link>

            <Button type="button" variant="outline" className="gap-2">
              <SquarePen className="size-4" aria-hidden />
              Edit Event
            </Button>

            <div className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden />
            <Button type="button" variant="success" className="gap-2">
              <CheckCircle className="size-4" aria-hidden />
              Complete Event
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
