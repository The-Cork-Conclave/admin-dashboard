"use client";

import { DollarSign, TrendingDown, TrendingUp, UserPlus, Ticket, Waves } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  getRevenueMetrics,
  RevenueMetricsDTO,
  getMembersMetrics,
  MembersMetricsDTO,
  getTicketsMetrics,
  TicketsMetricsDTO,
} from "./get-metrics";
import { formatNairaFromKobo } from "@/lib/utils";

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

  if (query.isLoading) {
    return <MetricCardSkeleton description="Total Received" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <DollarSign className="size-4" />
          </div>
        </CardTitle>
        <CardDescription>Total Received</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">
            {formatNairaFromKobo(`${metric?.total ?? 0}`).pretty}
          </div>
        </div>
        <p className="text-muted-foreground text-sm">Total revenue from event ticket sales</p>
      </CardContent>
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
    return <MetricCardSkeleton description="New Members" showBadge />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <UserPlus className="size-4" />
          </div>
        </CardTitle>
        <CardDescription>New Members</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">{metric?.total ?? 0}</div>
          <Badge variant={`${(metric?.delta ?? 0) >= 0 ? "success" : "destructive"}`}>
            {(metric?.delta ?? 0) >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {metric?.delta ?? 0}%
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">New members registered this month</p>
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
          <Badge variant={`${(metric?.delta ?? 0) >= 0 ? "success" : "destructive"}`}>
            {(metric?.delta ?? 0) >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {metric?.delta ?? 0}%
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">Number of paid tickets for events this month</p>
      </CardContent>
    </Card>
  );
}

function AttendanceCard() {
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
          <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">0%</div>
        </div>
        <p className="text-muted-foreground text-sm">% of ticket holders who checked in this month</p>
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
