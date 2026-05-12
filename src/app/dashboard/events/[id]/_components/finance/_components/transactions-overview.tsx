"use client";

import * as React from "react";

import { AlertCircle } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

import type { MetricsDTO } from "../../insights/api";
import { formatMetricChartLabel } from "../../insights/format-metric-chart-label";

type TransactionsOverviewCardProps = {
  errorMessage?: string;
  isLoading?: boolean;
  metrics?: MetricsDTO;
  onRetry?: () => void;
};

type TransactionChartPoint = {
  expense: number;
  income: number;
  label: string;
};

const chartConfig = {
  expense: {
    color: "var(--chart-4)",
    label: "Expense",
  },
  income: {
    color: "var(--chart-2)",
    label: "Income",
  },
} satisfies ChartConfig;

function koboToNaira(kobo: number) {
  return kobo / 100;
}

function formatNaira(value: number | string) {
  return formatCurrency(Number(value), { currency: "NGN" });
}

function buildChartData(metrics: MetricsDTO | undefined): TransactionChartPoint[] {
  if (!metrics) return [];

  const paymentMap = new Map(metrics.payments.map((item) => [item.label, koboToNaira(item.value)]));
  const expenseMap = new Map(metrics.expenses.map((item) => [item.label, koboToNaira(item.value)]));
  const labels = Array.from(
    new Set([...metrics.payments.map((item) => item.label), ...metrics.expenses.map((item) => item.label)]),
  );

  return labels.map((rawLabel) => ({
    expense: expenseMap.get(rawLabel) ?? 0,
    income: paymentMap.get(rawLabel) ?? 0,
    label: formatMetricChartLabel(rawLabel),
  }));
}

export function TransactionsOverviewCard({ errorMessage, isLoading, metrics, onRetry }: TransactionsOverviewCardProps) {
  const chartData = React.useMemo(() => buildChartData(metrics), [metrics]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-normal">Overview</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <Skeleton className="h-50 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (errorMessage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-normal">Overview</CardTitle>
        </CardHeader>

        <CardContent className="flex min-h-50 flex-col items-start justify-center gap-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 text-destructive" />
            <div className="space-y-1">
              <p className="font-medium text-sm">Could not load overview data</p>
              <p className="text-muted-foreground text-sm">{errorMessage}</p>
            </div>
          </div>
          {onRetry ? (
            <Button size="sm" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-normal">Overview</CardTitle>
        </CardHeader>

        <CardContent className="flex min-h-50 items-center justify-center">
          <p className="text-muted-foreground text-sm">No transaction data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Overview</CardTitle>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-50 w-full">
          <LineChart accessibilityLayer data={chartData} margin={{ bottom: 0, left: 0, right: 0, top: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis axisLine={false} dataKey="label" tickLine={false} tickMargin={10} tick={{ fontSize: 12 }} />
            <YAxis hide axisLine={false} tickLine={false} tickMargin={10} tick={{ fontSize: 12 }} />
            <ChartTooltip
              cursor={false}
              content={({ active, payload, label }) => (
                <ChartTooltipContent
                  active={active}
                  label={label}
                  payload={payload?.map((item) => ({
                    ...item,
                    value: typeof item.value === "number" ? formatNaira(item.value) : item.value,
                  }))}
                />
              )}
            />
            <Line
              connectNulls
              dataKey="income"
              dot={false}
              stroke="var(--color-income)"
              strokeDasharray="5 5"
              strokeLinecap="round"
              strokeWidth={1}
              type="linear"
            />
            <Line
              dataKey="expense"
              dot={false}
              stroke="var(--color-expense)"
              strokeLinecap="round"
              strokeWidth={3}
              type="linear"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
