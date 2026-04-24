"use client";

import * as React from "react";
import { Bar, CartesianGrid, ComposedChart, XAxis, YAxis } from "recharts";
import { MetricsDTO } from "./api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatMetricChartLabel } from "./format-metric-chart-label";

const registrationChartConfig = {
  count: {
    label: "Registrations",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type RegistrationPoint = { period: string; count: number };

function toRegistrationChartData(items: NonNullable<MetricsDTO["registrations"]> | undefined): RegistrationPoint[] {
  if (!items?.length) return [];
  return items.map((r) => ({ period: formatMetricChartLabel(r.label), count: r.value }));
}

function formatAverageTimeToPayment(minutes: number | undefined): string {
  if (minutes == null || !Number.isFinite(minutes) || minutes < 0) {
    return "—";
  }
  const totalSeconds = Math.round(minutes * 60);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m === 0) {
    return `${s}s`;
  }
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function EventPerformance({ metrics }: { metrics: MetricsDTO | undefined }) {
  const chartData = React.useMemo(() => toRegistrationChartData(metrics?.registrations), [metrics?.registrations]);
  const maxCount = Math.max(1, ...chartData.map((d) => d.count), 0);

  return (
    <Card className="h-full min-h-0 shadow-xs">
      <CardHeader>
        <CardTitle>Registration Volume Over Time</CardTitle>
        <CardDescription>New registrations per day or month from event created through event day</CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricChip
            label="Reg. to Payment"
            value={`${(metrics?.reg_to_payment_conversion ?? 0).toFixed(2)}%`}
            note="Conversion rate from initial form to checkout"
          />
          <MetricChip
            label="Payment to Attendance"
            value={`${(metrics?.payment_to_attendance_conversion ?? 0).toFixed(2)}%`}
            note="Conversion of paid ticket holders who showed up"
          />
          <MetricChip
            label="Avg. Time to Payment"
            value={formatAverageTimeToPayment(metrics?.average_time_to_payment)}
            note="From registration to successful payment"
          />
        </div>
        <ChartContainer config={registrationChartConfig} className="h-68 w-full">
          <ComposedChart data={chartData} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.25} />
            <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis
              tickFormatter={(v) => String(Math.round(v))}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={44}
              domain={[0, Math.max(maxCount * 1.1, 1)]}
            />
            <ChartTooltip
              cursor={false}
              content={({ active, label, payload }) => (
                <ChartTooltipContent
                  active={active}
                  label={label}
                  className="w-48"
                  payload={payload?.map((item) => {
                    if (item.dataKey === "count" && typeof item.value === "number") {
                      return { ...item, name: "Registrations", value: String(Math.round(item.value)) };
                    }
                    return item;
                  })}
                />
              )}
            />
            <Bar
              dataKey="count"
              name="Registrations"
              fill="var(--color-count)"
              fillOpacity={0.22}
              stroke="var(--color-count)"
              strokeOpacity={0.35}
              radius={[5, 5, 0, 0]}
              barSize={chartData.length > 24 ? 8 : 14}
              isAnimationActive={chartData.length > 0}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function MetricChip({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-md border bg-muted/35 px-3 py-2.5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-semibold text-lg tabular-nums">{value}</p>
      <p className="text-muted-foreground text-xs">{note}</p>
    </div>
  );
}
