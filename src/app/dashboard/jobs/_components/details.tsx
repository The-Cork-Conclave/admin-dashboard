import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { JobStatusBadge, JobName } from "./columns";
import { Copy, TriangleAlert } from "lucide-react";
import { copyToClipboard } from "@/lib/copy-to-clipboard";
import { format, parseISO } from "date-fns";
import * as React from "react";
import type { JobRow } from "./schema";

export type JobDetailsProps = {
  job: JobRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry?: (job: JobRow) => Promise<void> | void;
  retryPending?: boolean;
};

export default function JobDetails({ job, open, onOpenChange, onRetry, retryPending }: JobDetailsProps) {
  const runAt = job?.run_at ? format(parseISO(job.run_at), "do MMMM yyyy h:mm:ss a") : "—";
  const processedAt = job?.processed_at ? format(parseISO(job.processed_at), "do MMMM yyyy h:mm:ss a") : "—";
  const createdAt = job?.created_at ? format(parseISO(job.created_at), "do MMMM yyyy h:mm:ss a") : "—";

  const prettyPayload = (() => {
    try {
      const v = typeof job?.payload === "string" ? JSON.parse(job.payload) : job?.payload;
      return JSON.stringify(v ?? {}, null, 2);
    } catch {
      return String(job?.payload ?? "");
    }
  })();

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="w-screen! sm:min-w-150 xl:min-w-125">
        <DrawerHeader className="flex flex-col gap-2">
          <DrawerTitle>{job ? JobName(job.name) : "Job details"}</DrawerTitle>
          <div className="flex gap-2 justify-between">
            <span className="font-medium text-xs text-muted-foreground">
              {job?.id ?? "—"}
              <Button
                className="cursor-pointer h-4"
                variant="ghost"
                disabled={!job?.id}
                onClick={() => job?.id && copyToClipboard(job.id)}
              >
                <Copy />
              </Button>
            </span>

            {job ? <JobStatusBadge status={job.status} /> : null}
          </div>
        </DrawerHeader>

        <div className="flex flex-col gap-8 px-6">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Attempts</span>
              <span className="font-medium tabular-nums">
                {job ? (
                  <>
                    {job.attempts} / {job.max_attempts}
                  </>
                ) : (
                  "—"
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Created At</span>
              <span className="font-medium tabular-nums">{createdAt}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Run At</span>
              <span className="font-medium tabular-nums">{runAt}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Processed At</span>
              <span className="font-medium tabular-nums">{processedAt}</span>
            </div>
          </div>

          {job?.last_error && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-red-600 flex items-center gap-1.5">
                  <TriangleAlert className="text-sm h-8" />
                  Last Error
                </h3>
                <Button
                  className="cursor-pointer"
                  variant="destructive"
                  onClick={() => copyToClipboard(String(job.last_error))}
                >
                  <Copy />
                </Button>
              </div>

              <div className="rounded-xl border border-red-200/60 bg-red-50/50 p-4 shadow-sm">
                <p className="text-xs font-mono text-red-700 leading-relaxed whitespace-pre-wrap wrap-break-word">
                  {String(job.last_error)}
                </p>
              </div>
            </div>
          )}

          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-zinc-900">Payload</h3>
              <Button
                className="cursor-pointer h-4"
                variant="ghost"
                disabled={!job}
                onClick={() => copyToClipboard(prettyPayload)}
              >
                <Copy />
              </Button>
            </div>
            <div className="rounded-xl border border-zinc-200/80 bg-zinc-100/50 p-4 shadow-sm overflow-x-auto">
              <pre className="text-xs font-mono text-zinc-700 leading-relaxed whitespace-pre">{prettyPayload}</pre>
            </div>
          </section>
        </div>

        <DrawerFooter>
          {job?.status === "failed" ? (
            <Button disabled={!onRetry || retryPending} onClick={() => onRetry?.(job)}>
              Retry
            </Button>
          ) : null}
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
