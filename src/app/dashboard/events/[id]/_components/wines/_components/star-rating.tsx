import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

type StarRatingProps = {
  rating: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
};

export function StarRating({ rating, max = 5, size = "sm", className }: StarRatingProps) {
  const iconClass = size === "sm" ? "size-2.5" : "size-3.5";

  return (
    <div className={cn("flex items-center gap-0.5 text-amber-500", className)}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.round(rating);
        return (
          <Star
            key={i}
            className={cn(iconClass, filled ? "fill-amber-500 text-amber-500" : "fill-none text-muted-foreground/40")}
          />
        );
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
