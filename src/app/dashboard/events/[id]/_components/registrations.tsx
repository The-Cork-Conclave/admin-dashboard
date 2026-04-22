"use client";
"use no memo";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  type PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Activity,
  Search,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { registrationColumns } from "./columns";
import type { RegistrationRow } from "./schema";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/date-range-picker";
import { fetchEventRegistrationsList } from "../../_lib/fetch-events-registrations-list";
import useDebouncedValue from "@/hooks/use-debounced-value";
import { EventsRegistrationTableSkeleton } from "./events-registrations-skeleton";

const statusOptions = [
  { value: "all", label: "All" },
  { value: "confirmed", label: "Paid" },
  { value: "pending_payment", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
] as const;

const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
] as const;

const Registrations = ({ id }: { id: string }) => {
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [searchInput, setSearchInput] = React.useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 350);
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
      `events-${id}-registrations`,
      page,
      perPage,
      debouncedSearch,
      status,
      dateRange?.from?.toISOString() ?? "",
      dateRange?.to?.toISOString() ?? "",
      sort.sortBy,
      sort.sortOrder,
    ],
    queryFn: () =>
      fetchEventRegistrationsList(id, {
        page,
        perPage,
        q: debouncedSearch.trim() ? debouncedSearch.trim() : undefined,
        status: status === "all" ? undefined : status,
        dateFrom: dateRange?.from ? dateRange.from.toISOString() : undefined,
        dateTo: dateRange?.to ? dateRange.to.toISOString() : undefined,
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder,
      }),
    placeholderData: keepPreviousData,
  });

  const data = (query.data?.data ?? []) as RegistrationRow[];
  const total = query.data?.meta.total ?? 0;
  const pageCount = Math.max(1, query.data?.meta.total_pages ?? 1);

  const table = useReactTable({
    data,
    columns: registrationColumns,
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
    <div className="mt-8 pt-8">
      <Card>
        <CardHeader>
          <CardTitle className="leading-none">
            {total} Registered Member{total !== 1 ? "s" : ""}
          </CardTitle>

          <CardAction>
            <Button variant="outline" size="sm">
              <Download />
              Export
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="pt-2 mt-2">
          {query.isLoading ? (
            <EventsRegistrationTableSkeleton rowCount={pagination.pageSize} />
          ) : (
            <div className="space-y-4 flex flex-col gap-2">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-full lg:w-80">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="h-7 rounded-[min(var(--radius-md),12px)] pl-8"
                      placeholder="Search members..."
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center xl:w-auto">
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
                      <DropdownMenuRadioGroup
                        value={sortValue}
                        onValueChange={(v) => setSortValue(v as typeof sortValue)}
                      >
                        {sortOptions.map((option) => (
                          <DropdownMenuRadioItem key={option.value} value={option.value}>
                            {option.label}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border bg-card">
                <Table>
                  <TableHeader className="bg-muted/15">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id} colSpan={header.colSpan} className="h-11 p-3 font-medium">
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
                        <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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
                <div className="hidden flex-1 text-muted-foreground text-sm lg:flex"></div>
                <div className="flex w-full items-center gap-8 lg:w-fit">
                  <div className="hidden items-center gap-2 lg:flex">
                    <Label htmlFor="events-rows-per-page" className="font-medium text-sm">
                      Rows per page
                    </Label>
                    <Select
                      value={`${table.getState().pagination.pageSize}`}
                      onValueChange={(value) => {
                        table.setPageSize(Number(value));
                      }}
                    >
                      <SelectTrigger size="sm" className="w-20" id="events-rows-per-page">
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
    </div>
  );
};

export default Registrations;
