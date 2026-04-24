"use client";

import * as React from "react";
import { Area, ComposedChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { MetricsDTO } from "./api";
import { formatNairaFromKobo } from "@/lib/utils";
import { formatMetricChartLabel } from "./format-metric-chart-label";

type PaymentChartPoint = { label: string; revenue: number };

function koboToNaira(kobo: number): number {
  return kobo / 100;
}

function formatNaira(naira: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "NGN" }).format(naira);
}

function buildCumulativePaymentSeries(payments: MetricsDTO["payments"] | undefined): PaymentChartPoint[] {
  if (!payments?.length) return [];
  return payments.map((p) => ({
    label: formatMetricChartLabel(p.label),
    revenue: koboToNaira(p.value),
  }));
}

function yDomainNaira(points: PaymentChartPoint[]): [number, number] {
  if (points.length === 0) return [0, 1];
  const maxR = Math.max(...points.map((p) => p.revenue), 0);
  const pad = Math.max(maxR * 0.08, 1);
  return [0, maxR + pad];
}

export function AnalyticsOverview({ metrics }: { metrics: MetricsDTO | undefined }) {
  const paymentSeries = React.useMemo(() => buildCumulativePaymentSeries(metrics?.payments), [metrics?.payments]);

  const revenueChartConfig = {
    revenue: {
      label: "Cumulative received",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  const [yMin, yMax] = yDomainNaira(paymentSeries);

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-2">
          <div>
            <div className="font-medium text-muted-foreground text-sm">Total Received</div>
            <div className="font-semibold text-4xl tabular-nums tracking-tight">
              {formatNairaFromKobo(`${metrics?.total_received ?? 0}`).pretty}
            </div>
          </div>

          <ChartContainer config={revenueChartConfig} className="h-25 w-full rounded-md border">
            <ComposedChart data={paymentSeries} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
              <XAxis dataKey="label" hide tickLine={false} axisLine={false} />
              <YAxis hide domain={[yMin, yMax]} allowDataOverflow={false} />
              <ChartTooltip
                cursor={false}
                content={({ active, label, payload }) => (
                  <ChartTooltipContent
                    active={active}
                    label={label}
                    payload={payload?.map((item) => {
                      if (item.dataKey === "revenue" && typeof item.value === "number") {
                        return { ...item, value: formatNaira(item.value) };
                      }
                      return item;
                    })}
                  />
                )}
              />
              <Area
                dataKey="revenue"
                type="natural"
                fill="var(--color-revenue)"
                fillOpacity={0.14}
                stroke="var(--color-revenue)"
                isAnimationActive={paymentSeries.length > 0}
              />
            </ComposedChart>
          </ChartContainer>
        </div>

        <Card className="py-4 shadow-xs lg:col-span-2">
          <CardHeader className="px-4">
            <CardTitle>Event Performance</CardTitle>
            <CardDescription>Track registrations, ticket sales, attendance, and no-shows</CardDescription>
          </CardHeader>

          <CardContent className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:[&>div:first-child]:pl-0 lg:[&>div:last-child]:pr-0 lg:[&>div]:px-5 mt-2">
            <div className="space-y-1">
              <div className="text-muted-foreground text-sm">Registrations</div>
              <div className="font-semibold text-2xl tabular-nums">{metrics?.total_registrations ?? 0}</div>
            </div>

            <div className="space-y-1">
              <div className="text-muted-foreground text-sm">Tickets Sold</div>
              <div className="font-semibold text-2xl tabular-nums">{metrics?.total_tickets ?? 0}</div>
            </div>

            <div className="space-y-1">
              <div className="text-muted-foreground text-sm">Total Attendees</div>
              <div className="font-semibold text-2xl tabular-nums">{metrics?.total_attendees ?? 0}</div>
            </div>

            <div className="space-y-1">
              <div className="text-muted-foreground text-sm">Total No-shows</div>
              <div className="font-semibold text-2xl tabular-nums">{metrics?.total_no_shows ?? 0}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
