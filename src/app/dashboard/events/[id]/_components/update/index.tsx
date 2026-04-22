"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UpdateEventForm } from "./update-event-form";

export default function UpdateEvent({ id }: { id: string }) {
  return (
    <main className="mx-auto w-full max-w-5xl p-6 md:p-10 lg:p-12">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <UpdateEventForm
          id={id}
          footer={({ isPending }: { isPending: boolean }) => (
            <div className="flex flex-col-reverse items-center justify-between gap-4 border-border border-t bg-muted/30 px-6 py-5 sm:flex-row md:px-8">
              <Button asChild variant="destructive" className="w-full sm:w-auto">
                <Link href="/dashboard/events">Cancel</Link>
              </Button>

              <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
                <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
                  {isPending ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        />
      </div>
    </main>
  );
}
