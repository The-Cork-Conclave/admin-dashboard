"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardAction, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { getSignupGraph, SignupGraphDTO } from "./api";

const signupChartConfig = {
  signups: {
    label: "Signups",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export default function MembersActivity() {
  const query = useQuery({
    queryKey: ["signup-graph"],
    queryFn: getSignupGraph,
  });

  const graphData: SignupGraphDTO | undefined = query.data;
  const chartData = (graphData?.data ?? []).map((item) => ({ label: item.label, signups: item.value }));

  return (
    <div className="w-full h-full">
      <Card className="xl:col-span-12 h-full flex flex-col">
        <CardHeader className="mb-2 pb-2">
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

        <CardContent className="flex-1">
          {query.isFetching ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <ChartContainer config={signupChartConfig} className="h-72 w-full lg:col-span-8">
              <BarChart data={chartData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }} barSize={38}>
                <defs>
                  <pattern
                    id="signup-signups-pattern"
                    width="4"
                    height="4"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)"
                  >
                    <rect width="6" height="6" fill="var(--color-signups)" fillOpacity="0.15" />
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="6"
                      stroke="var(--color-signups)"
                      strokeWidth="1.25"
                      strokeOpacity="0.40"
                    />
                  </pattern>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="0" />
                <XAxis dataKey="label" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                <Bar
                  dataKey="signups"
                  fill="url(#signup-signups-pattern)"
                  radius={[8, 8, 0, 0]}
                  stroke="var(--color-signups)"
                  strokeOpacity={0.5}
                  strokeWidth={0.5}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
