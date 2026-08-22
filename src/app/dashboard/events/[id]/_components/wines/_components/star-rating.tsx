import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

type StarRatingProps = {
  rating: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
};

function fillFor(rating: number, index: number): "full" | "half" | "empty" {
  const threshold = index + 1;
  if (rating >= threshold) return "full";
  if (rating >= threshold - 0.5) return "half";
  return "empty";
}

export function StarRating({ rating, max = 5, size = "sm", className }: StarRatingProps) {
  const iconClass = size === "sm" ? "size-2.5" : "size-3.5";

  return (
    <div className={cn("flex items-center gap-0.5 text-amber-500", className)}>
      {Array.from({ length: max }, (_, i) => {
        const fill = fillFor(rating, i);
        if (fill === "full") {
          return <Star key={i} className={cn(iconClass, "fill-amber-500 text-amber-500")} />;
        }
        if (fill === "half") {
          return (
            <span key={i} className={cn("relative inline-flex", iconClass)}>
              <Star className={cn(iconClass, "fill-none text-muted-foreground/40")} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                <Star className={cn(iconClass, "fill-amber-500 text-amber-500")} />
              </span>
            </span>
          );
        }
        return <Star key={i} className={cn(iconClass, "fill-none text-muted-foreground/40")} />;
      })}
    </div>
  );
}

export function colorBadgeClass(color: string) {
  switch (color) {
    case "Red":
      return "bg-primary/10 text-primary";
    case "White":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
    case "Rosé":
      return "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300";
    case "Sparkling":
      return "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}
