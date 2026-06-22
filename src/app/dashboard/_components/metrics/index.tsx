"use client";

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { CirclePlus, DollarSign, Ticket, UserPlus, Waves } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNairaFromKobo } from "@/lib/utils";

import {
  type AttendanceMetricsDTO,
  getAttendanceMetrics,
  getMembersMetrics,
  getRevenueMetrics,
  getTicketsMetrics,
  type MembersMetricsDTO,
  type RevenueMetricsDTO,
  type TicketsMetricsDTO,
} from "./api";
import { MetricDeltaBadge } from "./metric-delta-badge";
import { RevenueOpeningBalanceModal } from "./revenue-opening-balance-modal";

const METRIC_CHANGE_FOOTER = "Change vs previous calendar month";

type MetricCardSkeletonProps = {
  description: string;
  showBadge?: boolean;
};

function MetricCardSkeleton({ description, showBadge = false }: MetricCardSkeletonProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <Skeleton className="size-4 rounded" />
          </div>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-28" />
          {showBadge ? <Skeleton className="h-6 w-14 rounded-full" /> : null}
        </div>
        <Skeleton className="h-4 w-64" />
        {showBadge ? <Skeleton className="h-4 w-48" /> : null}
      </CardContent>
    </Card>
  );
}

function RevenueCard() {
  const query = useQuery({
    queryKey: ["revenue-metrics"],
    queryFn: getRevenueMetrics,
  });

  const metric: RevenueMetricsDTO | undefined = query.data;
  const [open, setOpen] = useState(false);

  if (query.isLoading) {
    return <MetricCardSkeleton description="Total Received" showBadge />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-start justify-between gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <DollarSign className="size-4" />
          </div>
          <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => setOpen(true)}>
            <CirclePlus className="size-4" />
            <span className="sr-only">Set opening revenue</span>
          </Button>
        </CardTitle>
        <CardDescription>Total Received</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">
            {formatNairaFromKobo(`${metric?.total_revenue_in_kobo ?? 0}`).pretty}
          </div>
          <MetricDeltaBadge delta={metric?.delta ?? 0} />
        </div>
        <p className="text-muted-foreground text-xs">{METRIC_CHANGE_FOOTER}</p>
      </CardContent>

      <RevenueOpeningBalanceModal
        initialPreviousRevenueInKobo={metric?.previous_revenue_in_kobo ?? 0}
        open={open}
        onOpenChange={setOpen}
        onSaved={async () => {
          await query.refetch();
        }}
      />
    </Card>
  );
}

function MembersCard() {
  const query = useQuery({
    queryKey: ["members-metrics"],
    queryFn: getMembersMetrics,
  });

  const metric: MembersMetricsDTO | undefined = query.data;

  if (query.isLoading) {
    return <MetricCardSkeleton description="Members" showBadge />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <UserPlus className="size-4" />
          </div>
        </CardTitle>
        <CardDescription>Members</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">{metric?.total ?? 0}</div>
          <MetricDeltaBadge delta={metric?.delta ?? 0} />
        </div>
        <p className="text-muted-foreground text-xs">{METRIC_CHANGE_FOOTER}</p>
      </CardContent>
    </Card>
  );
}

function TicketsCard() {
  const query = useQuery({
    queryKey: ["tickets-metrics"],
    queryFn: getTicketsMetrics,
  });

  const metric: TicketsMetricsDTO | undefined = query.data;

  if (query.isLoading) {
    return <MetricCardSkeleton description="Tickets Sold" showBadge />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <Ticket className="size-4" />
          </div>
        </CardTitle>
        <CardDescription>Tickets Sold</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">{metric?.total ?? 0}</div>
          <MetricDeltaBadge delta={metric?.delta ?? 0} />
        </div>
        <p className="text-muted-foreground text-xs">{METRIC_CHANGE_FOOTER}</p>
      </CardContent>
    </Card>
  );
}

function AttendanceCard() {
  const query = useQuery({
    queryKey: ["attendance-metrics"],
    queryFn: getAttendanceMetrics,
  });

  const metric: AttendanceMetricsDTO | undefined = query.data;

  if (query.isLoading) {
    return <MetricCardSkeleton description="Attendance Rate" showBadge />;
  }

  const fmtPercent = (n: number | undefined) => `${Math.round(n ?? 0)}%`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <Waves className="size-4" />
          </div>
        </CardTitle>
        <CardDescription>Attendance Rate</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">
            {fmtPercent(metric?.total)}
          </div>
          <MetricDeltaBadge delta={metric?.delta ?? 0} />
        </div>
        <p className="text-muted-foreground text-xs">{METRIC_CHANGE_FOOTER}</p>
      </CardContent>
    </Card>
  );
}

export function MetricCards() {
  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <RevenueCard />
      <MembersCard />
      <TicketsCard />
      <AttendanceCard />
    </div>
  );
}
