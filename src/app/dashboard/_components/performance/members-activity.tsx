"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardAction, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";

const pipelineChartValues = [34, 38, 31, 47, 42, 51, 44, 40, 58, 46, 43, 49] as const;

const pipelineChartConfig = {
  qualified: {
    label: "Qualified",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const axisMonthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
const tooltipMonthFormatter = new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" });

function getRollingMonthData(values: readonly number[]) {
  return values.map((qualified, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (values.length - 1 - index));

    return {
      date: date.toISOString(),
      qualified,
    };
  });
}

export default function MembersActivity() {
  const pipelineChartData = getRollingMonthData(pipelineChartValues);

  return (
    <div className="w-full">
      <Card className="xl:col-span-12">
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            <span>Track members signup over time</span>
          </CardDescription>

          <CardAction className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              View report
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          <ChartContainer config={pipelineChartConfig} className="h-72 w-full lg:col-span-8">
            <BarChart data={pipelineChartData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }} barSize={38}>
              <defs>
                <pattern
                  id="crm-qualified-pattern"
                  width="4"
                  height="4"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <rect width="6" height="6" fill="var(--color-qualified)" fillOpacity="0.15" />
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="6"
                    stroke="var(--color-qualified)"
                    strokeWidth="1.25"
                    strokeOpacity="0.40"
                  />
                </pattern>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="0" />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => axisMonthFormatter.format(new Date(String(value)))}
              />
              <YAxis hide />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideIndicator
                    labelFormatter={(value) => tooltipMonthFormatter.format(new Date(String(value)))}
                  />
                }
              />
              <Bar
                dataKey="qualified"
                fill="url(#crm-qualified-pattern)"
                radius={[8, 8, 0, 0]}
                stroke="var(--color-qualified)"
                strokeOpacity={0.5}
                strokeWidth={0.5}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
