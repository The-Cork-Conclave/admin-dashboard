"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { formatCurrency, formatDateTime } from "@/lib/utils";

import type { ExpenseRow } from "./expenses-table-schema";

function formatExpenseAmount(row: ExpenseRow) {
  return formatCurrency(row.amount_in_kobo / 100, { currency: row.currency });
}

function renderOptionalValue(value: string | null | undefined) {
  if (!value) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  return <span className="font-medium text-sm">{value}</span>;
}

export const expensesTableColumns: ColumnDef<ExpenseRow>[] = [
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
    accessorKey: "amount_in_kobo",
    header: "Amount",
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-medium text-sm">{formatExpenseAmount(row.original)}</p>
        <p className="text-muted-foreground text-xs">{row.original.currency}</p>
      </div>
    ),
  },
  {
    accessorKey: "expense_date",
    header: "Expense Date",
    cell: ({ row }) => (
      <span className="font-medium text-muted-foreground text-sm">
        {formatDateTime(row.original.expense_date ?? undefined)}
      </span>
    ),
  },
  {
    accessorKey: "vendor_name",
    header: "Vendor",
    cell: ({ row }) => renderOptionalValue(row.original.vendor_name),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => renderOptionalValue(row.original.category),
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => (
      <span className="font-medium text-muted-foreground text-sm">{formatDateTime(row.original.created_at)}</span>
    ),
  },
];
