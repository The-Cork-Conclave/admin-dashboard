"use client";

import type * as React from "react";

import { format, parseISO } from "date-fns";
import { Calendar, Copy, CreditCard, FileText, Link2, Pencil, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { copyToClipboard } from "@/lib/copy-to-clipboard";
import { formatCurrency, formatDateTime } from "@/lib/utils";

import type { ExpenseRow } from "./expenses-table-schema";

export type ExpenseDetailsDrawerProps = {
  expense: ExpenseRow | null;
  isDeletePending?: boolean;
  onDeleteClick?: () => void;
  onEditClick?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatExpenseAmount(expense: ExpenseRow | null) {
  if (!expense) return "—";
  return formatCurrency(expense.amount_in_kobo / 100, { currency: expense.currency });
}

function formatExpenseDate(value?: string | null) {
  if (!value) return "—";
  try {
    return format(parseISO(value), "MMM d, yyyy");
  } catch {
    return value;
  }
}

function formatPaymentMethod(value?: string | null) {
  switch ((value ?? "").toLowerCase()) {
    case "transfer":
      return "Bank Transfer";
    case "card":
      return "Card";
    case "cash":
      return "Cash";
    case "other":
      return "Other";
    default:
      return "—";
  }
}

function renderOptionalText(value?: string | null) {
  return value?.trim() ? value : "—";
}

function getReceiptFileName(value?: string | null) {
  if (!value) return "Receipt";
  try {
    const url = new URL(value);
    const lastSegment = url.pathname.split("/").filter(Boolean).pop();
    return decodeURIComponent(lastSegment ?? "Receipt");
  } catch {
    return value;
  }
}

function ExpenseDetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-2 p-3 text-sm sm:grid-cols-3">
      <div className="text-muted-foreground sm:col-span-1">{label}</div>
      <div className="font-medium text-foreground sm:col-span-2">{value}</div>
    </div>
  );
}

export function ExpenseDetailsDrawer({
  expense,
  isDeletePending,
  onDeleteClick,
  onEditClick,
  open,
  onOpenChange,
}: ExpenseDetailsDrawerProps) {
  const createdAt = expense?.created_at ? formatDateTime(expense.created_at) : "—";
  const updatedAt = expense?.updated_at ? formatDateTime(expense.updated_at) : "—";
  const expenseDate = formatExpenseDate(expense?.expense_date);
  const paymentMethod = formatPaymentMethod(expense?.payment_method);
  const receiptFileName = getReceiptFileName(expense?.receipt_url);

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="w-screen! sm:min-w-150 xl:min-w-125">
        <DrawerHeader className="border-b bg-muted/20 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <DrawerTitle className="truncate text-lg">{expense?.title ?? "Expense details"}</DrawerTitle>
                {expense?.category ? (
                  <Badge variant="outline" className="rounded-md px-2 py-0.5 text-xs">
                    {expense.category}
                  </Badge>
                ) : null}
              </div>
              <DrawerDescription className="flex items-center gap-2 text-xs">
                <span>ID: {expense?.id ?? "—"}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-5"
                  disabled={!expense?.id}
                  onClick={() => expense?.id && copyToClipboard(expense.id, "Expense ID copied!")}
                >
                  <Copy className="size-3.5" />
                  <span className="sr-only">Copy expense ID</span>
                </Button>
              </DrawerDescription>
            </div>

            <DrawerClose asChild>
              <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0">
                <X className="size-4" />
                <span className="sr-only">Close drawer</span>
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div className="rounded-xl border bg-muted/30 px-4 py-6 text-center">
            <div className="mb-1 font-medium text-muted-foreground text-xs">Total Amount</div>
            <div className="mb-4 font-semibold text-3xl tracking-tight">{formatExpenseAmount(expense)}</div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-muted-foreground text-sm">
              <div className="flex items-center gap-1.5">
                <Calendar className="size-4" />
                <span>{expenseDate}</span>
              </div>
              <div className="hidden h-1 w-1 rounded-full bg-border sm:block" />
              <div className="flex items-center gap-1.5">
                <CreditCard className="size-4" />
                <span>{paymentMethod}</span>
              </div>
            </div>
          </div>

          <section className="space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Expense Details</h3>
            <div className="overflow-hidden rounded-xl border bg-background">
              <ExpenseDetailRow label="Description" value={renderOptionalText(expense?.description)} />
              <div className="border-t" />
              <ExpenseDetailRow label="Vendor" value={renderOptionalText(expense?.vendor_name)} />
              <div className="border-t" />
              <ExpenseDetailRow
                label="Paid By"
                value={
                  expense?.paid_by ? (
                    <div className="flex items-center gap-2">
                      <span>{expense.paid_by}</span>
                    </div>
                  ) : (
                    "—"
                  )
                }
              />
              <div className="border-t" />
              <ExpenseDetailRow label="Category" value={renderOptionalText(expense?.category)} />
              <div className="border-t" />
              <ExpenseDetailRow label="Method" value={paymentMethod} />
              <div className="border-t" />
              <ExpenseDetailRow label="Date" value={expenseDate} />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Receipt</h3>
            {expense?.receipt_url ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border bg-background p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                    <FileText className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-sm">{receiptFileName}</div>
                    <div className="text-muted-foreground text-xs">Added {createdAt}</div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => copyToClipboard(expense.receipt_url as string, "Receipt link copied!")}
                  >
                    <Link2 className="size-4" />
                    <span className="sr-only">Copy receipt link</span>
                  </Button>
                  <Button asChild type="button" variant="outline" size="sm">
                    <a href={expense.receipt_url} target="_blank" rel="noreferrer">
                      View Receipt
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed bg-muted/20 p-4 text-muted-foreground text-sm">
                No receipt has been added for this expense yet.
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Metadata</h3>
            <div className="space-y-3 rounded-xl border bg-muted/30 p-4 text-muted-foreground text-xs">
              <div className="flex items-center justify-between gap-3">
                <span>Created at</span>
                <span className="font-medium text-foreground">{createdAt}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Updated at</span>
                <span className="font-medium text-foreground">{updatedAt}</span>
              </div>
            </div>
          </section>
        </div>

        <DrawerFooter className="border-t bg-muted/20 p-5">
          <div className="flex flex-row-reverse items-center justify-between gap-3">
            <Button type="button" disabled={!expense || isDeletePending} onClick={onEditClick}>
              <Pencil className="size-4" />
              Edit Expense
            </Button>
            <Button type="button" variant="destructive" disabled={!expense || isDeletePending} onClick={onDeleteClick}>
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
