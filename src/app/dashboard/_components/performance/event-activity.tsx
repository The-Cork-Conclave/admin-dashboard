"use client";

import * as React from "react";
import { format, isValid, parseISO } from "date-fns";
import { Area, CartesianGrid, ComposedChart, Line, XAxis } from "recharts";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { MonthYearPicker } from "@/components/month-year-picker";
import { getEventsActivity } from "./api";

function safeParseISO(value: unknown): Date | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const d = parseISO(trimmed);
  return isValid(d) ? d : undefined;
}

const chartConfig = {
  registrations: {
    label: "Registrations",
    color: "var(--chart-2)",
  },
  tickets: {
    label: "Tickets Sold",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export default function EventActivity() {
  const currentYear = new Date().getFullYear();
  const years = React.useMemo(() => Array.from({ length: currentYear - 2026 + 1 }, (_, i) => 2026 + i), [currentYear]);

  const [mode, setMode] = React.useState<"month" | "year">("month");
  const [selectedYear, setSelectedYear] = React.useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = React.useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  });

  const queryValue = React.useMemo(() => {
    if (mode === "year") return new Date(Date.UTC(selectedYear, 0, 1, 0, 0, 0, 0)).toISOString();
    return new Date(Date.UTC(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1, 0, 0, 0, 0)).toISOString();
  }, [mode, selectedMonth, selectedYear]);

  const query = useQuery({
    queryKey: ["events-activity", mode, queryValue],
    queryFn: () => getEventsActivity({ type: mode, value: queryValue }),
  });

  const chartData = React.useMemo(() => {
    const data = query.data;
    if (!data) return [];

    const len = Math.max(data.registrations.length, data.tickets.length);
    const out: Array<{ date: string; registrations: number; tickets: number }> = [];

    for (let i = 0; i < len; i++) {
      const reg = data.registrations[i] ?? { label: "", value: 0 };
      const ticket = data.tickets[i] ?? { label: "", value: 0 };

      const rawLabel = (reg.label && String(reg.label).trim().length > 0 ? reg.label : ticket.label) ?? "";
      const x = mode === "month" ? String(rawLabel).trim() : String(rawLabel).trim();

      out.push({
        date: x,
        registrations: typeof reg.value === "number" ? reg.value : 0,
        tickets: typeof ticket.value === "number" ? ticket.value : 0,
      });
    }
    return out;
  }, [mode, query.data]);

  return (
    <div className="w-full h-full">
      <Card className="@container/card h-full flex flex-col">
        <CardHeader>
          <CardTitle className="leading-none">Event Activity</CardTitle>
          <CardDescription>
            <span>Track registrations and paid tickets over time</span>
          </CardDescription>
          <CardAction className="flex items-center gap-2">
            <Select value={mode} onValueChange={(v) => setMode(v as "month" | "year")}>
              <SelectTrigger size="sm">
                <SelectValue placeholder="View" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectGroup>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            {mode === "year" ? (
              <Select value={`${selectedYear}`} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger size="sm" className="w-24">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectGroup>
                    {years.map((y) => (
                      <SelectItem key={y} value={`${y}`}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            ) : (
              <MonthYearPicker
                value={selectedMonth}
                onChange={(next) => setSelectedMonth(next)}
                fromYear={2026}
                toYear={currentYear}
              />
            )}
          </CardAction>
        </CardHeader>

        <CardContent className="flex-1">
          {query.isError ? (
            <div className="text-destructive text-sm">
              {query.error instanceof Error ? query.error.message : "Could not load event activity."}
            </div>
          ) : null}
          {query.isFetching ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <ChartContainer config={chartConfig} className="aspect-auto h-80 w-full">
              <ComposedChart data={chartData} margin={{ top: 0 }}>
                <defs>
                  <linearGradient id="fillRegistrations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-registrations)" stopOpacity={0.36} />
                    <stop offset="95%" stopColor="var(--color-registrations)" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeOpacity={0.5} />

                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={48}
                  tickFormatter={(value) => {
                    if (mode === "year") return String(value);
                    const d = safeParseISO(String(value));
                    if (!d) return String(value);
                    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  }}
                />

                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      className="w-50"
                      indicator="line"
                      labelFormatter={(value) => {
                        if (mode === "year") return String(value);
                        const d = safeParseISO(String(value));
                        if (!d) return String(value);
                        return format(d, "MMMM d");
                      }}
                    />
                  }
                />
                <ChartLegend verticalAlign="top" content={<ChartLegendContent className="mb-5 justify-end" />} />

                <Area
                  dataKey="registrations"
                  type="natural"
                  fill="url(#fillRegistrations)"
                  stroke="var(--color-registrations)"
                  strokeWidth={1.25}
                  dot={false}
                  fillOpacity={1}
                />
                <Line dataKey="tickets" type="natural" stroke="var(--color-tickets)" strokeWidth={1.2} dot={false} />
              </ComposedChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
