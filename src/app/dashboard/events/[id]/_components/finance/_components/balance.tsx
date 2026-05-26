"use client";

import * as React from "react";

import { AlertCircle } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNairaFromKobo } from "@/lib/utils";

type BalanceKey = "revenue" | "expenses";

type BalanceDistributionCardProps = {
  errorMessage?: string;
  expensesInKobo: number;
  isLoading?: boolean;
  netBalanceInKobo: number;
  onRetry?: () => void;
  previousBalanceInKobo?: number;
  revenueInKobo: number;
};

const chartConfig = {
  amountInKobo: {
    label: "Balance",
  },
  revenue: {
    label: "Revenue",
    color: "var(--chart-2)",
  },
  expenses: {
    label: "Expenses",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

const getAccountColor = (key: BalanceKey) => {
  const config = chartConfig[key];

  return "color" in config ? config.color : undefined;
};

function formatPercentage(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

export function BalanceDistributionCard({
  errorMessage,
  expensesInKobo,
  isLoading,
  netBalanceInKobo,
  onRetry,
  previousBalanceInKobo,
  revenueInKobo,
}: BalanceDistributionCardProps) {
  const chartData = React.useMemo(() => {
    const totalFlowInKobo = revenueInKobo + expensesInKobo;

    return [
      {
        account: "Revenue",
        amountInKobo: revenueInKobo,
        fill: getAccountColor("revenue"),
        key: "revenue" as const,
        percentage: totalFlowInKobo > 0 ? (revenueInKobo / totalFlowInKobo) * 100 : 0,
      },
      {
        account: "Expenses",
        amountInKobo: expensesInKobo,
        fill: getAccountColor("expenses"),
        key: "expenses" as const,
        percentage: totalFlowInKobo > 0 ? (expensesInKobo / totalFlowInKobo) * 100 : 0,
      },
    ];
  }, [expensesInKobo, revenueInKobo]);

  const hasOpeningBalance = (previousBalanceInKobo ?? 0) > 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-normal">Account Allocation</CardTitle>
        </CardHeader>

        <CardContent className="grid items-center gap-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
          <div className="mx-auto flex aspect-square h-50 w-full max-w-50 items-center justify-center">
            <Skeleton className="h-36 w-36 rounded-full" />
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            {Array.from({ length: 2 }).map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows are static and never reordered
              <div className="grid grid-cols-[1fr_auto] items-end gap-3" key={index}>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-28" />
                </div>
                <Skeleton className="h-5 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (errorMessage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-normal">Account Allocation</CardTitle>
        </CardHeader>

        <CardContent className="flex min-h-50 flex-col items-start justify-center gap-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 text-destructive" />
            <div className="space-y-1">
              <p className="font-medium text-sm">Could not load balance data</p>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Account Allocation</CardTitle>
      </CardHeader>

      <CardContent className="grid items-center gap-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
        {hasOpeningBalance ? (
          <div className="sm:col-span-2">
            <div className="text-muted-foreground text-xs">
              Includes opening balance of {formatNairaFromKobo(String(previousBalanceInKobo ?? 0)).pretty}.
            </div>
          </div>
        ) : null}
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-50">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={({ active, payload, label }) => (
                <ChartTooltipContent
                  active={active}
                  className="w-52"
                  hideLabel
                  label={label}
                  nameKey="account"
                  payload={payload?.map((item) => ({
                    ...item,
                    value: typeof item.value === "number" ? formatNairaFromKobo(String(item.value)).pretty : item.value,
                  }))}
                />
              )}
            />
            <Pie
              cornerRadius={6}
              data={chartData}
              dataKey="amountInKobo"
              innerRadius={65}
              nameKey="account"
              outerRadius={90}
              paddingAngle={2}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (!(viewBox && "cx" in viewBox && "cy" in viewBox)) {
                    return null;
                  }

                  return (
                    <text dominantBaseline="middle" textAnchor="middle" x={viewBox.cx} y={viewBox.cy}>
                      <tspan className="fill-muted-foreground text-xs" x={viewBox.cx} y={(viewBox.cy ?? 0) - 8}>
                        Total
                      </tspan>
                      <tspan
                        className="fill-foreground font-heading font-medium text-sm tabular-nums"
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) + 14}
                      >
                        {formatNairaFromKobo(String(netBalanceInKobo)).pretty}
                      </tspan>
                    </text>
                  );
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        <div className="flex min-w-0 flex-col gap-3">
          {chartData.map((item) => (
            <div className="grid grid-cols-[1fr_auto] items-end gap-3" key={item.key}>
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-1">
                  <span aria-hidden="true" className="h-2 w-1 rounded-full" style={{ backgroundColor: item.fill }} />
                  <p className="truncate text-muted-foreground text-xs">{item.account}</p>
                </div>
                <p className="font-medium tabular-nums">{formatNairaFromKobo(String(item.amountInKobo)).pretty}</p>
              </div>
              <div className="font-medium tabular-nums">{formatPercentage(item.percentage)}%</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
