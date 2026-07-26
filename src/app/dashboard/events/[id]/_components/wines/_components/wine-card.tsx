"use client";

import Image from "next/image";

import { formatDistanceToNow } from "date-fns";
import { Star, Wine } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cloudinaryDisplayUrl } from "@/lib/cloudinary-client-upload";
import { cn } from "@/lib/utils";

import type { EventWineListItem } from "../_lib/wines-api.client";
import { colorBadgeClass } from "./star-rating";

type WineCardProps = {
  wine: EventWineListItem;
  onClick: () => void;
};

export default function WineCard({ wine, onClick }: WineCardProps) {
  const announcedLabel = wine.announced_at
    ? formatDistanceToNow(new Date(wine.announced_at), { addSuffix: true })
    : null;
  const imageSrc = wine.image_url?.trim() ? cloudinaryDisplayUrl(wine.image_url) : "";

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="flex w-full cursor-pointer flex-col gap-6 p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex gap-4">
        <div className="relative flex size-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
          {imageSrc ? (
            <Image src={imageSrc} alt={wine.name} fill unoptimized className="object-cover" />
          ) : (
            <Wine className="size-7 text-muted-foreground/40" />
          )}
        </div>
        <div className="w-full min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-2">
            <h3 className="truncate font-medium text-base tracking-tight">{wine.name}</h3>
            <Badge
              variant="outline"
              className={cn("shrink-0 border-transparent px-2 py-0.5 text-[10px]", colorBadgeClass(wine.color))}
            >
              {wine.color}
            </Badge>
          </div>
          <p className="mb-3 truncate text-muted-foreground text-xs">
            {[wine.region, wine.country].filter(Boolean).join(", ") || wine.producer}
            {wine.year ? ` • ${wine.year}` : ""}
          </p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tabular-nums">{wine.average_rating.toFixed(1)}</span>
              <Star className="size-3.5 fill-amber-500 text-amber-500" />
              <span className="ml-1 text-[11px] text-muted-foreground">({wine.review_count} reviews)</span>
            </div>
            {announcedLabel ? (
              <div className="hidden text-[11px] text-muted-foreground sm:block">{announcedLabel}</div>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
