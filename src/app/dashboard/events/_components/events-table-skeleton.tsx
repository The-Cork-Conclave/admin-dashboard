import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const COLS = 7;

type EventsTableSkeletonProps = {
  rowCount?: number;
};

export function EventsTableSkeleton({ rowCount = 10 }: EventsTableSkeletonProps) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader className="bg-muted/15">
            <TableRow>
              {Array.from({ length: COLS }, (_, i) => (
                <TableHead key={i} className="h-11 p-3">
                  <Skeleton className="h-4 w-24" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }, (_, ri) => (
              <TableRow key={ri}>
                {Array.from({ length: COLS }, (_, ci) => (
                  <TableCell key={ci} className="p-3 align-middle">
                    <Skeleton className={ci === 0 ? "h-10 w-full max-w-[260px]" : "h-4 w-28"} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-1">
        <Skeleton className="hidden h-4 w-32 lg:block" />
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="h-4 w-28" />
          <div className="ml-auto flex gap-2 lg:ml-0">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="size-8 rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

