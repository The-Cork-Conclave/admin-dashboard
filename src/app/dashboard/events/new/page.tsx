"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CreateEventForm } from "./_components/create-event-form";

export default function Page() {
  return (
    <main className="w-full max-w-5xl mx-auto p-6 md:p-10 lg:p-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3">
          Create Event
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Fill in the details below to create a new Cork Conclave event.
        </p>
      </header>

      <div className="mb-8 flex items-start sm:items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted border border-border text-muted-foreground">
          <span className="text-sm font-medium">i</span>
        </div>
        <p className="text-sm font-medium text-muted-foreground">Only one event can be active at a time.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <CreateEventForm
          footer={({ isPending }: { isPending: boolean }) => (
            <div className="bg-muted/30 border-t border-border px-6 py-5 md:px-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
              <Button asChild variant="ghost" className="w-full sm:w-auto">
                <Link href="/dashboard/events">Cancel</Link>
              </Button>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
                  {isPending ? "Creating…" : "Create Event"}
                </Button>
              </div>
            </div>
          )}
        />
      </div>
    </main>
  );
}
