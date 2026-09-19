"use client";

import * as React from "react";

import Link from "next/link";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { flexRender, getCoreRowModel, type PaginationState, useReactTable } from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CirclePlus,
  Pencil,
  PlusIcon,
  RefreshCw,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

import { DateRangePicker } from "@/components/date-range-picker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import useDebouncedValue from "@/hooks/use-debounced-value";
import { TABLE_PAGE_SIZE } from "@/lib/table-pagination";
import { formatCurrency, formatDateTime, formatNairaFromKobo } from "@/lib/utils";

import { RevenueOpeningBalanceModal } from "../../_components/metrics/revenue-opening-balance-modal";
import {
  deleteFinanceItem,
  type FinanceEventRowDTO,
  type FinanceItemType,
  getFinanceSummary,
  listFinanceEvents,
  listFinanceItems,
  type PlatformFinanceItemDTO,
} from "../_lib/api";
import { ItemFormModal } from "./item-form-modal";
import { RequeryPaymentModal } from "./requery-payment-modal";

const typeFilterOptions = [
  { value: "all", label: "All types" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
] as const;

const itemSortOptions = [
  { value: "newest", label: "Newest first", sortBy: "created_at", sortOrder: "desc" },
  { value: "oldest", label: "Oldest first", sortBy: "created_at", sortOrder: "asc" },
  { value: "amount-desc", label: "Amount high-low", sortBy: "amount_in_kobo", sortOrder: "desc" },
  { value: "amount-asc", label: "Amount low-high", sortBy: "amount_in_kobo", sortOrder: "asc" },
  { value: "title-asc", label: "Title A-Z", sortBy: "title", sortOrder: "asc" },
] as const;

const eventSortOptions = [
  { value: "name-asc", label: "Name A-Z", sortBy: "name", sortOrder: "asc" },
  { value: "name-desc", label: "Name Z-A", sortBy: "name", sortOrder: "desc" },
  { value: "payments-desc", label: "Payments high-low", sortBy: "payments_total", sortOrder: "desc" },
  { value: "expenses-desc", label: "Expenses high-low", sortBy: "expenses_total", sortOrder: "desc" },
] as const;

function SummaryCards() {
  const queryClient = useQueryClient();
  const [openingOpen, setOpeningOpen] = React.useState(false);
  const [requeryOpen, setRequeryOpen] = React.useState(false);
  const query = useQuery({
    queryKey: ["finance-summary"],
    queryFn: getFinanceSummary,
  });

  const s = query.data;

  const rows = [
    [
      { label: "Payments received", value: s?.payments_total ?? 0 },
      { label: "Opening revenue", value: s?.previous_revenue_in_kobo ?? 0, editable: true as const },
      { label: "Event expenses", value: s?.event_expenses_total ?? 0 },
    ],
    [
      { label: "Non-event income", value: s?.non_event_income_total ?? 0 },
      { label: "Non-event expenses", value: s?.non_event_expense_total ?? 0 },
      { label: "Net", value: s?.net ?? 0 },
    ],
  ];

  return (
    <>
      <Card className="py-4 shadow-xs">
        <CardHeader className="px-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Overview</CardTitle>
              <CardDescription>Payments, expenses, and platform adjustments across the app</CardDescription>
            </div>
            <CardAction>
              <Button size="sm" variant="outline" onClick={() => setRequeryOpen(true)}>
                <RefreshCw />
                Requery payment
              </Button>
            </CardAction>
          </div>
        </CardHeader>

        <CardContent className="mt-2 space-y-4 px-4 lg:space-y-0 lg:divide-y">
          {rows.map((row) => (
            <div
              key={row.map((m) => m.label).join("|")}
              className="grid grid-cols-1 gap-4 py-0 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:[&>div:first-child]:pl-0 sm:[&>div:last-child]:pr-0 sm:[&>div]:px-5 lg:py-4 lg:first:pt-0 lg:last:pb-0"
            >
              {row.map((metric) => (
                <div key={metric.label} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-muted-foreground text-sm">{metric.label}</div>
                    {"editable" in metric && metric.editable ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0"
                        onClick={() => setOpeningOpen(true)}
                      >
                        <CirclePlus className="size-4" />
                        <span className="sr-only">Edit opening revenue</span>
                      </Button>
                    ) : null}
                  </div>
                  <div className="font-semibold text-2xl tabular-nums tracking-tight">
                    {query.isLoading ? (
                      <Skeleton className="h-8 w-28" />
                    ) : (
                      formatNairaFromKobo(`${metric.value}`).pretty
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
      <RevenueOpeningBalanceModal
        open={openingOpen}
        onOpenChange={setOpeningOpen}
        initialPreviousRevenueInKobo={s?.previous_revenue_in_kobo ?? 0}
        onSaved={async () => {
          await queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
        }}
      />
      <RequeryPaymentModal open={requeryOpen} onOpenChange={setRequeryOpen} />
    </>
  );
}

function EventsBreakdown() {
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: TABLE_PAGE_SIZE });
  const [searchInput, setSearchInput] = React.useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [sortValue, setSortValue] = React.useState<(typeof eventSortOptions)[number]["value"]>("name-asc");
  const sort = eventSortOptions.find((o) => o.value === sortValue) ?? eventSortOptions[0];

  const query = useQuery({
    queryKey: ["finance-events", pagination.pageIndex, pagination.pageSize, debouncedSearch, sortValue],
    queryFn: () =>
      listFinanceEvents({
        page: pagination.pageIndex + 1,
        perPage: pagination.pageSize,
        q: debouncedSearch.trim() || undefined,
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder,
      }),
    placeholderData: keepPreviousData,
  });

  const columns = React.useMemo<ColumnDef<FinanceEventRowDTO>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Event",
        cell: ({ row }) => (
          <Link
            href={`/dashboard/events/${row.original.id}?tab=finance`}
            className="font-medium text-sm underline-offset-4 hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <span className="text-muted-foreground text-sm capitalize">{row.original.status}</span>,
      },
      {
        accessorKey: "payments_total",
        header: "Payments",
        cell: ({ row }) => formatNairaFromKobo(`${row.original.payments_total}`).pretty,
      },
      {
        accessorKey: "expenses_total",
        header: "Expenses",
        cell: ({ row }) => formatNairaFromKobo(`${row.original.expenses_total}`).pretty,
      },
      {
        accessorKey: "previous_balance_in_kobo",
        header: "Opening",
        cell: ({ row }) => formatNairaFromKobo(`${row.original.previous_balance_in_kobo}`).pretty,
      },
      {
        accessorKey: "event_net",
        header: "Event net",
        cell: ({ row }) => formatNairaFromKobo(`${row.original.event_net}`).pretty,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: query.data?.data ?? [],
    columns,
    pageCount: Math.max(1, query.data?.meta.total_pages ?? 1),
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return (
    <Card>
      <CardHeader className="gap-4 space-y-0">
        <div>
          <CardTitle>Events</CardTitle>
          <CardDescription>Read-only per-event finance. Open an event to manage its expenses.</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search events…"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ArrowUpDown className="size-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={sortValue}
                onValueChange={(v) => setSortValue(v as (typeof eventSortOptions)[number]["value"])}
              >
                {eventSortOptions.map((o) => (
                  <DropdownMenuRadioItem key={o.value} value={o.value}>
                    {o.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {query.isPending ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    No events found.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <PaginationBar
          pageIndex={pagination.pageIndex}
          pageCount={table.getPageCount()}
          total={query.data?.meta.total ?? 0}
          canPrevious={table.getCanPreviousPage()}
          canNext={table.getCanNextPage()}
          onFirst={() => table.setPageIndex(0)}
          onPrev={() => table.previousPage()}
          onNext={() => table.nextPage()}
          onLast={() => table.setPageIndex(table.getPageCount() - 1)}
        />
      </CardContent>
    </Card>
  );
}

function NonEventItems() {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: TABLE_PAGE_SIZE });
  const [searchInput, setSearchInput] = React.useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [typeFilter, setTypeFilter] = React.useState<(typeof typeFilterOptions)[number]["value"]>("all");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const [sortValue, setSortValue] = React.useState<(typeof itemSortOptions)[number]["value"]>("newest");
  const sort = itemSortOptions.find((o) => o.value === sortValue) ?? itemSortOptions[0];

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PlatformFinanceItemDTO | null>(null);
  const [deleting, setDeleting] = React.useState<PlatformFinanceItemDTO | null>(null);

  const dateFrom = dateRange?.from ? dateRange.from.toISOString() : undefined;
  const dateTo = dateRange?.to
    ? new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate() + 1).toISOString()
    : undefined;

  const query = useQuery({
    queryKey: [
      "finance-items",
      pagination.pageIndex,
      pagination.pageSize,
      debouncedSearch,
      typeFilter,
      dateFrom,
      dateTo,
      sortValue,
    ],
    queryFn: () =>
      listFinanceItems({
        page: pagination.pageIndex + 1,
        perPage: pagination.pageSize,
        q: debouncedSearch.trim() || undefined,
        type: typeFilter as FinanceItemType | "all",
        dateFrom,
        dateTo,
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder,
      }),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFinanceItem(id),
    onSuccess: async () => {
      toast.success("Finance item deleted");
      setDeleting(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["finance-items"] }),
        queryClient.invalidateQueries({ queryKey: ["finance-summary"] }),
      ]);
    },
    onError: (err: Error) => {
      toast.error("Could not delete item", { description: err.message });
    },
  });

  const invalidate = React.useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["finance-items"] }),
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] }),
    ]);
  }, [queryClient]);

  const columns = React.useMemo<ColumnDef<PlatformFinanceItemDTO>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-1">
            <p className="truncate font-medium text-sm">{row.original.title}</p>
            {row.original.description ? (
              <p className="truncate text-muted-foreground text-xs">{row.original.description}</p>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => <span className="capitalize text-sm">{row.original.type}</span>,
      },
      {
        accessorKey: "amount_in_kobo",
        header: "Amount",
        cell: ({ row }) => formatCurrency(row.original.amount_in_kobo / 100, { currency: row.original.currency }),
      },
      {
        accessorKey: "item_date",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">{formatDateTime(row.original.item_date ?? undefined)}</span>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => row.original.category || <span className="text-muted-foreground">—</span>,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => {
                setEditing(row.original);
                setFormOpen(true);
              }}
            >
              <Pencil className="size-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-destructive"
              onClick={() => setDeleting(row.original)}
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: query.data?.data ?? [],
    columns,
    pageCount: Math.max(1, query.data?.meta.total_pages ?? 1),
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return (
    <>
      <Card>
        <CardHeader className="gap-4 space-y-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Non-event items</CardTitle>
              <CardDescription>Income and expenses not tied to an event.</CardDescription>
            </div>
            <CardAction>
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <PlusIcon />
                Add item
              </Button>
            </CardAction>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search items…"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter(v as (typeof typeFilterOptions)[number]["value"]);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeFilterOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DateRangePicker
              value={dateRange}
              onChange={(v) => {
                setDateRange(v);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowUpDown className="size-4" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup
                  value={sortValue}
                  onValueChange={(v) => setSortValue(v as (typeof itemSortOptions)[number]["value"])}
                >
                  {itemSortOptions.map((o) => (
                    <DropdownMenuRadioItem key={o.value} value={o.value}>
                      {o.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {query.isPending ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                      No finance items yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <PaginationBar
            pageIndex={pagination.pageIndex}
            pageCount={table.getPageCount()}
            total={query.data?.meta.total ?? 0}
            canPrevious={table.getCanPreviousPage()}
            canNext={table.getCanNextPage()}
            onFirst={() => table.setPageIndex(0)}
            onPrev={() => table.previousPage()}
            onNext={() => table.nextPage()}
            onLast={() => table.setPageIndex(table.getPageCount() - 1)}
          />
        </CardContent>
      </Card>

      <ItemFormModal
        open={formOpen}
        item={editing}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        onSaved={invalidate}
      />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (deleteMutation.isPending) return;
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? (
                <>
                  <span className="font-medium text-foreground">{deleting.title}</span> will be deleted. This cannot be
                  undone.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending || !deleting}
              onClick={(e) => {
                e.preventDefault();
                if (deleting) deleteMutation.mutate(deleting.id);
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Yes, delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function PaginationBar(props: {
  pageIndex: number;
  pageCount: number;
  total: number;
  canPrevious: boolean;
  canNext: boolean;
  onFirst: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLast: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-muted-foreground text-sm">
        {props.total} total · Page {props.pageIndex + 1} of {props.pageCount}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="size-8" disabled={!props.canPrevious} onClick={props.onFirst}>
          <ChevronsLeft className="size-4" />
        </Button>
        <Button variant="outline" size="icon" className="size-8" disabled={!props.canPrevious} onClick={props.onPrev}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="icon" className="size-8" disabled={!props.canNext} onClick={props.onNext}>
          <ChevronRight className="size-4" />
        </Button>
        <Button variant="outline" size="icon" className="size-8" disabled={!props.canNext} onClick={props.onLast}>
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function FinanceView() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Wallet className="size-5 text-muted-foreground" />
        <div>
          <h1 className="font-medium text-xl tracking-tight">Finance</h1>
          <p className="text-muted-foreground text-sm">App-wide overview across events and platform items.</p>
        </div>
      </div>
      <SummaryCards />
      <EventsBreakdown />
      <NonEventItems />
    </div>
  );
}
