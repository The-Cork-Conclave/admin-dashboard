import { Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const customerInitials = ["EM", "OW", "NO", "MM"] as const;

export default function Reviews() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">Reviews</CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          4.6 average rating
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="rounded-lg bg-muted p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex gap-0.5 text-foreground">
                <Star className="size-3.5 fill-current" />
                <Star className="size-3.5 fill-current" />
                <Star className="size-3.5 fill-current" />
                <Star className="size-3.5 fill-current" />
                <Star className="size-3.5 fill-current" />
              </div>
              <div>
                <div className="font-medium text-sm">Melody Macy</div>
                <p className="mt-2 line-clamp-3 min-h-[4.5em] text-muted-foreground text-sm">
                  The linen overshirt arrived faster than expected and the fit was exactly right.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-muted p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex gap-0.5 text-foreground">
                <Star className="size-3.5 fill-current" />
                <Star className="size-3.5 fill-current" />
                <Star className="size-3.5 fill-current" />
                <Star className="size-3.5 fill-current" />
                <Star className="size-3.5 fill-current" />
              </div>
              <div>
                <div className="font-medium text-sm">Melody Macy</div>
                <p className="mt-2 line-clamp-3 min-h-[4.5em] text-muted-foreground text-sm">
                  The linen overshirt arrived faster than expected and the fit was exactly right.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-muted p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex gap-0.5 text-foreground">
                <Star className="size-3.5 fill-current" />
                <Star className="size-3.5 fill-current" />
                <Star className="size-3.5 fill-current" />
                <Star className="size-3.5 fill-current" />
                <Star className="size-3.5 fill-current" />
              </div>
              <div>
                <div className="font-medium text-sm">Melody Macy</div>
                <p className="mt-2 line-clamp-3 min-h-[4.5em] text-muted-foreground text-sm">
                  The linen overshirt arrived faster than expected and the fit was exactly right.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
          <div className="min-w-0">
            <div className="font-medium text-sm">12.8K reviews</div>
            <div className="line-clamp-2 min-h-[3em] text-muted-foreground text-xs">Customers reviewed this month</div>
          </div>

          <AvatarGroup>
            {customerInitials.map((initials) => (
              <Avatar key={initials}>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            ))}

            <AvatarGroupCount>+42</AvatarGroupCount>
          </AvatarGroup>
        </div>
      </CardContent>
    </Card>
  );
}
