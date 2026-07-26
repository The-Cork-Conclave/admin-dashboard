"use client";

import Image from "next/image";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Star, Wine, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cloudinaryDisplayUrl } from "@/lib/cloudinary-client-upload";

import { fetchEventWineDetail } from "../_lib/wines-api.client";
import { StarRating } from "./star-rating";

type WineDetailsDrawerProps = {
  eventId: string;
  eventWineId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function WineDetailsDrawer({ eventId, eventWineId, open, onOpenChange }: WineDetailsDrawerProps) {
  const detailQuery = useQuery({
    queryKey: ["events", eventId, "wines", eventWineId],
    queryFn: () => {
      if (!eventWineId) throw new Error("Missing event wine id");
      return fetchEventWineDetail(eventId, eventWineId);
    },
    enabled: open && Boolean(eventWineId),
  });

  const wine = detailQuery.data;
  const imageSrc = wine?.image_url?.trim() ? cloudinaryDisplayUrl(wine.image_url) : "";

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="w-screen! sm:min-w-md xl:min-w-md">
        <DrawerHeader className="border-b bg-muted/20 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DrawerTitle className="text-lg">Wine Details &amp; Reviews</DrawerTitle>
              <DrawerDescription className="sr-only">Reviews for this event wine</DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0">
                <X className="size-4" />
                <span className="sr-only">Close drawer</span>
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 space-y-8 overflow-y-auto p-6">
          {detailQuery.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : detailQuery.isError ? (
            <p className="rounded-xl border border-dashed py-10 text-center text-muted-foreground text-sm">
              {detailQuery.error instanceof Error ? detailQuery.error.message : "Could not load wine details."}
            </p>
          ) : wine ? (
            <>
              <div className="flex gap-5">
                <div className="relative flex size-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/40">
                  {imageSrc ? (
                    <Image src={imageSrc} alt={wine.name} fill unoptimized className="object-cover" />
                  ) : (
                    <Wine className="size-8 text-muted-foreground/50" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-xl tracking-tight">{wine.name}</h3>
                  <p className="mt-1 text-muted-foreground text-sm">
                    {[wine.region, wine.country].filter(Boolean).join(", ") || wine.producer}
                    {wine.year ? ` • ${wine.year}` : ""}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-lg tabular-nums">{wine.average_rating.toFixed(1)}</span>
                      <Star className="size-4 fill-amber-500 text-amber-500" />
                    </div>
                    <span className="border-l pl-3 text-muted-foreground text-xs">
                      {wine.review_count} Total Reviews
                    </span>
                  </div>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground text-xs">Producer</dt>
                  <dd className="font-medium">{wine.producer}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Type</dt>
                  <dd className="font-medium">{wine.wine_type}</dd>
                </div>
                {wine.grape_variety ? (
                  <div>
                    <dt className="text-muted-foreground text-xs">Grape</dt>
                    <dd className="font-medium">{wine.grape_variety}</dd>
                  </div>
                ) : null}
                {wine.alcohol_level != null ? (
                  <div>
                    <dt className="text-muted-foreground text-xs">Alcohol</dt>
                    <dd className="font-medium">{wine.alcohol_level}%</dd>
                  </div>
                ) : null}
              </dl>

              <Separator />

              <div>
                <h4 className="mb-5 font-medium text-sm">All Reviews</h4>
                {wine.reviews.length === 0 ? (
                  <p className="rounded-xl border border-dashed py-10 text-center text-muted-foreground text-sm">
                    No reviews yet.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {wine.reviews.map((review) => (
                      <div key={review.id} className="border-border border-b pb-6 last:border-0 last:pb-0">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-sm">{review.user_name}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <StarRating rating={review.rating} className="mb-2" />
                        {review.comment ? (
                          <p className="text-muted-foreground text-sm leading-relaxed">{review.comment}</p>
                        ) : (
                          <p className="text-muted-foreground text-sm italic">No written comment.</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
