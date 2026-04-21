"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UpdateEventForm } from "./update-event-form";

export function EditEventPageClient({ id }: { id: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <UpdateEventForm
        id={id}
        footer={({ isPending }: { isPending: boolean }) => (
          <div className="bg-muted/30 border-t border-border px-6 py-5 md:px-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
            <Button asChild variant="destructive" className="w-full sm:w-auto">
              <Link href="/dashboard/events">Cancel</Link>
            </Button>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
                {isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      />
    </div>
  );
}

