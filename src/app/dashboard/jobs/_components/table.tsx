"use client";

import * as React from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  type PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { Activity, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { DateRangePicker } from "@/components/date-range-picker";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import JobDetails from "./details";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchJobsList, retryJob } from "./api";
import { jobsColumns } from "./columns";
import { JobsTableSkeleton } from "./skeleton";
import type { JobRow } from "./schema";

const statusOptions = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
] as const;

export default function JobsTable() {
  const queryClient = useQueryClient();
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [selectedJob, setSelectedJob] = React.useState<JobRow | null>(null);

  const [status, setStatus] = React.useState<(typeof statusOptions)[number]["value"]>("all");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [sortValue, setSortValue] = React.useState<(typeof sortOptions)[number]["value"]>("newest");

  const handleDateRangeChange = (value: DateRange | undefined) => {
    setDateRange(value?.from && value?.to ? value : undefined);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  React.useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const page = pagination.pageIndex + 1;
  const perPage = pagination.pageSize;

  const sort = React.useMemo(() => {
    if (sortValue === "oldest") return { sortBy: "created_at" as const, sortOrder: "asc" as const };
    if (sortValue === "name-asc") return { sortBy: "name" as const, sortOrder: "asc" as const };
    if (sortValue === "name-desc") return { sortBy: "name" as const, sortOrder: "desc" as const };
    return { sortBy: "created_at" as const, sortOrder: "desc" as const };
  }, [sortValue]);

  const query = useQuery({
    queryKey: [
      "jobs",
      page,
      perPage,
      status,
      dateRange?.from?.toISOString() ?? "",
      dateRange?.to?.toISOString() ?? "",
      sort.sortBy,
      sort.sortOrder,
    ],
    queryFn: () =>
      fetchJobsList({
        page,
        perPage,
        status: status === "all" ? undefined : status,
        dateFrom: dateRange?.from ? dateRange.from.toISOString() : undefined,
        dateTo: dateRange?.to ? dateRange.to.toISOString() : undefined,
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder,
      }),
    placeholderData: keepPreviousData,
  });

  const retryMutation = useMutation({
    mutationFn: (jobId: string) => retryJob(jobId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job queued", { description: "We scheduled this job to run again shortly." });
    },
    onError: (err: Error) => {
      toast.error("Retry failed", { description: err.message });
    },
  });

  const data = React.useMemo(() => (query.data?.data ?? []) as JobRow[], [query.data]);
  const total = query.data?.meta.total ?? 0;
  const pageCount = Math.max(1, query.data?.meta.total_pages ?? 1);

  React.useEffect(() => {
    const id = selectedJob?.id;
    if (!id) return;
    const updated = data.find((j) => j.id === id);
    if (updated) setSelectedJob(updated);
  }, [data, selectedJob?.id]);

  const table = useReactTable({
    data,
    columns: jobsColumns,
    state: {
      rowSelection,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    pageCount,
    manualPagination: true,
    onPaginationChange: (updater) => {
      setPagination((old) => {
        const next = typeof updater === "function" ? updater(old) : updater;
        if (next.pageSize !== old.pageSize) {
          return { ...next, pageIndex: 0 };
        }
        return next;
      });
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <Card className="min-w-0 shadow-xs">
      <CardHeader>
        <CardTitle>Jobs</CardTitle>
        <CardAction>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center xl:w-auto">
            <JobDetails
              open={detailsOpen}
              onOpenChange={setDetailsOpen}
              job={selectedJob}
              retryPending={retryMutation.isPending}
              onRetry={async (job) => {
                // Optimistic UI so the drawer updates immediately.
                setSelectedJob((prev) => {
                  if (!prev || prev.id !== job.id) return prev;
                  return {
                    ...prev,
                    status: "pending",
                    run_at: new Date(Date.now() + 30_000).toISOString(),
                    processed_at: undefined,
                    last_error: undefined,
                    attempts: prev.attempts,
                  };
                });
                await retryMutation.mutateAsync(job.id);
              }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Activity />
                  Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-35" align="start">
                <DropdownMenuRadioGroup value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                  {statusOptions.map((s) => (
                    <DropdownMenuRadioItem key={s.value} value={s.value}>
                      {s.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex flex-col gap-1">
              <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowUpDown />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={sortValue} onValueChange={(v) => setSortValue(v as typeof sortValue)}>
                  {sortOptions.map((option) => (
                    <DropdownMenuRadioItem key={option.value} value={option.value}>
                      {option.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        {query.isLoading ? (
          <JobsTableSkeleton rowCount={pagination.pageSize} />
        ) : (
          <div className="flex flex-col gap-4 space-y-4">
            <div className="overflow-hidden rounded-lg border bg-card">
              <Table>
                <TableHeader className="bg-muted/15">
                  {table.getHeaderGroups().map((headerGroup, index) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={`${index}-${header.id}`}
                          colSpan={header.colSpan}
                          className="h-11 p-3 font-light text-muted-foreground text-sm"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>

                <TableBody>
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={`${row.id}-${row.index}`}
                        role="link"
                        tabIndex={0}
                        className="cursor-pointer hover:bg-muted-foreground/25"
                        onClick={() => {
                          setSelectedJob(row.original as JobRow);
                          setDetailsOpen(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedJob(row.original as JobRow);
                            setDetailsOpen(true);
                          }
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="p-3 align-middle">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-24 text-center">
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between px-1">
              <div className="hidden flex-1 text-muted-foreground text-sm lg:flex">
                {total} Job{total === 1 ? "" : "s"}
              </div>

              <div className="flex w-full items-center gap-8 lg:w-fit">
                <div className="hidden items-center gap-2 lg:flex">
                  <Label htmlFor="jobs-rows-per-page" className="font-medium text-sm">
                    Rows per page
                  </Label>
                  <Select
                    value={`${table.getState().pagination.pageSize}`}
                    onValueChange={(value) => {
                      table.setPageSize(Number(value));
                    }}
                  >
                    <SelectTrigger size="sm" className="w-20" id="jobs-rows-per-page">
                      <SelectValue placeholder={table.getState().pagination.pageSize} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      <SelectGroup>
                        {[10, 20, 30, 40, 50].map((pageSize) => (
                          <SelectItem key={pageSize} value={`${pageSize}`}>
                            {pageSize}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex w-fit items-center justify-center font-medium text-sm">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </div>
                <div className="ml-auto flex items-center gap-2 lg:ml-0">
                  <Button
                    variant="outline"
                    className="hidden size-8 lg:flex"
                    size="icon"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">Go to first page</span>
                    <ChevronsLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="size-8"
                    size="icon"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">Go to previous page</span>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="size-8"
                    size="icon"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Go to next page</span>
                    <ChevronRight className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="hidden size-8 lg:flex"
                    size="icon"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Go to last page</span>
                    <ChevronsRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
