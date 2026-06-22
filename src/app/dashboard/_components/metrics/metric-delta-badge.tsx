import { TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";

type MetricDeltaBadgeProps = {
  delta: number;
};

function formatDelta(delta: number) {
  const rounded = delta.toFixed(1);
  if (delta > 0) return `+${rounded}%`;
  if (delta < 0) return `${rounded}%`;
  return `${rounded}%`;
}

export function MetricDeltaBadge({ delta }: MetricDeltaBadgeProps) {
  const isPositive = delta >= 0;

  return (
    <Badge variant={isPositive ? "success" : "destructive"}>
      {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {formatDelta(delta)}
    </Badge>
  );
}
