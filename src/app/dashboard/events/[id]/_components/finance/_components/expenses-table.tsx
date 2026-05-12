"use client";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  type PaginationState,
  type Updater,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, PlusIcon, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { expensesTableColumns } from "./expenses-table-columns";
import type { ExpenseRow } from "./expenses-table-schema";

const sortOptions = [
  { value: "created-desc", label: "Newest first" },
  { value: "created-asc", label: "Oldest first" },
  { value: "expense-date-desc", label: "Expense date newest" },
  { value: "expense-date-asc", label: "Expense date oldest" },
  { value: "amount-desc", label: "Amount highest" },
  { value: "amount-asc", label: "Amount lowest" },
  { value: "title-asc", label: "Title A-Z" },
  { value: "title-desc", label: "Title Z-A" },
] as const;

export type ExpensesTableSortValue = (typeof sortOptions)[number]["value"];

export type ExpensesTableCardProps = {
  data: ExpenseRow[];
  errorMessage?: string;
  isFetching?: boolean;
  isLoading?: boolean;
  onAddExpenseClick?: () => void;
  onRowClick?: (expense: ExpenseRow) => void;
  onPaginationChange: (updater: Updater<PaginationState>) => void;
  onRetry?: () => void;
  onSearchInputChange: (value: string) => void;
  onSortValueChange: (value: ExpensesTableSortValue) => void;
  pageCount: number;
  pagination: PaginationState;
  searchInput: string;
  sortValue: ExpensesTableSortValue;
  totalRows: number;
};

function ExpensesTableLoadingState({ rowCount }: { rowCount: number }) {
  const skeletonRows = Array.from({ length: rowCount }, (_, index) => `row-${index + 1}`);
  const skeletonCells = Array.from({ length: 6 }, (_, index) => `cell-${index + 1}`);

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="space-y-3 p-4">
        {skeletonRows.map((rowKey) => (
          <div className="grid grid-cols-6 gap-3" key={rowKey}>
            {skeletonCells.map((cellKey) => (
              <Skeleton className="h-6 w-full" key={cellKey} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExpensesTableCard({
  data,
  errorMessage,
  isFetching,
  isLoading,
  onAddExpenseClick,
  onRowClick,
  onPaginationChange,
  onRetry,
  onSearchInputChange,
  onSortValueChange,
  pageCount,
  pagination,
  searchInput,
  sortValue,
  totalRows,
}: ExpensesTableCardProps) {
  const table = useReactTable({
    data,
    columns: expensesTableColumns,
    state: { pagination },
    getRowId: (row) => row.id,
    pageCount,
    manualPagination: true,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <Card>
      <CardHeader className="mb-2">
        <CardTitle className="leading-none">Expenses</CardTitle>
        <CardAction className="flex items-center gap-2">
          {isFetching && !isLoading ? <span className="text-muted-foreground text-xs">Updating...</span> : null}
          <Button size="sm" variant="outline" onClick={onAddExpenseClick}>
            <PlusIcon />
            Add Expense
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full lg:w-80">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-7 rounded-md border-foreground/25 pl-8"
                placeholder="Search expenses..."
                value={searchInput}
                onChange={(event) => onSearchInputChange(event.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <ArrowUpDown />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup
                  value={sortValue}
                  onValueChange={(value) => onSortValueChange(value as ExpensesTableSortValue)}
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

          {errorMessage ? (
            <div className="flex flex-col gap-3 rounded-lg border border-destructive/25 bg-destructive/5 p-4">
              <p className="text-destructive text-sm" role="alert">
                {errorMessage}
              </p>
              {onRetry ? (
                <div>
                  <Button size="sm" variant="outline" onClick={onRetry}>
                    Retry
                  </Button>
                </div>
              ) : null}
            </div>
          ) : isLoading ? (
            <ExpensesTableLoadingState rowCount={pagination.pageSize} />
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border bg-card">
                <Table>
                  <TableHeader className="bg-muted/15">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
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
                          role={onRowClick ? "button" : undefined}
                          tabIndex={onRowClick ? 0 : undefined}
                          className={
                            onRowClick ? "cursor-pointer hover:bg-muted/25 focus-visible:outline-none" : undefined
                          }
                          onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                          onKeyDown={
                            onRowClick
                              ? (event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    onRowClick(row.original);
                                  }
                                }
                              : undefined
                          }
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell className="p-3 align-middle" key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell className="h-24 text-center" colSpan={table.getVisibleLeafColumns().length}>
                          No expenses found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between px-1">
                <div className="hidden flex-1 text-muted-foreground text-sm lg:flex">
                  {totalRows} Expense{totalRows === 1 ? "" : "s"}
                </div>

                <div className="flex w-full items-center gap-8 lg:w-fit">
                  <div className="hidden items-center gap-2 lg:flex">
                    <Label className="font-medium text-sm" htmlFor="event-expenses-rows-per-page">
                      Rows per page
                    </Label>
                    <Select
                      value={`${table.getState().pagination.pageSize}`}
                      onValueChange={(value) => {
                        table.setPageSize(Number(value));
                      }}
                    >
                      <SelectTrigger className="w-20" id="event-expenses-rows-per-page" size="sm">
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
                      className="hidden size-8 lg:flex"
                      disabled={!table.getCanPreviousPage()}
                      onClick={() => table.setPageIndex(0)}
                      size="icon"
                      variant="outline"
                    >
                      <span className="sr-only">Go to first page</span>
                      <ChevronsLeft className="size-4" />
                    </Button>
                    <Button
                      className="size-8"
                      disabled={!table.getCanPreviousPage()}
                      onClick={() => table.previousPage()}
                      size="icon"
                      variant="outline"
                    >
                      <span className="sr-only">Go to previous page</span>
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      className="size-8"
                      disabled={!table.getCanNextPage()}
                      onClick={() => table.nextPage()}
                      size="icon"
                      variant="outline"
                    >
                      <span className="sr-only">Go to next page</span>
                      <ChevronRight className="size-4" />
                    </Button>
                    <Button
                      className="hidden size-8 lg:flex"
                      disabled={!table.getCanNextPage()}
                      onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                      size="icon"
                      variant="outline"
                    >
                      <span className="sr-only">Go to last page</span>
                      <ChevronsRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
