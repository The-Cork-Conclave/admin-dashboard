import { format, isValid, parse } from "date-fns";

export function formatMetricChartLabel(apiLabel: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(apiLabel)) {
    const d = parse(apiLabel, "yyyy-MM-dd", new Date());
    if (isValid(d)) return format(d, "MMM d");
  }
  if (/^\d{4}-\d{2}$/.test(apiLabel)) {
    const d = parse(`${apiLabel}-01`, "yyyy-MM-dd", new Date());
    if (isValid(d)) return format(d, "MMM");
  }
  return apiLabel;
}
