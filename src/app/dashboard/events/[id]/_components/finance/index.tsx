"use client";

import * as React from "react";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PaginationState } from "@tanstack/react-table";
import { toast } from "sonner";

import useDebouncedValue from "@/hooks/use-debounced-value";

import { AddExpenseModal } from "./_components/add-expense-modal";
import { DeleteExpenseDialog } from "./_components/delete-expense-dialog";
import { ExpenseDetailsDrawer } from "./_components/expense-details-drawer";
import Expenses from "./_components/expenses";
import type { ExpensesTableSortValue } from "./_components/expenses-table";
import type { ExpenseRow } from "./_components/expenses-table-schema";
import {
  deleteEventExpense,
  type EventExpensesListSortBy,
  type EventExpensesListSortOrder,
  getEventExpensesList,
  getEventFinanceSummary,
} from "./api";

function getExpenseSort(value: ExpensesTableSortValue): {
  sortBy: EventExpensesListSortBy;
  sortOrder: EventExpensesListSortOrder;
} {
  switch (value) {
    case "created-asc":
      return { sortBy: "created_at", sortOrder: "asc" };
    case "expense-date-desc":
      return { sortBy: "expense_date", sortOrder: "desc" };
    case "expense-date-asc":
      return { sortBy: "expense_date", sortOrder: "asc" };
    case "amount-desc":
      return { sortBy: "amount_in_kobo", sortOrder: "desc" };
    case "amount-asc":
      return { sortBy: "amount_in_kobo", sortOrder: "asc" };
    case "title-asc":
      return { sortBy: "title", sortOrder: "asc" };
    case "title-desc":
      return { sortBy: "title", sortOrder: "desc" };
    default:
      return { sortBy: "created_at", sortOrder: "desc" };
  }
}

export default function Finance({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const [isAddExpenseOpen, setIsAddExpenseOpen] = React.useState(false);
  const [isDeleteExpenseDialogOpen, setIsDeleteExpenseDialogOpen] = React.useState(false);
  const [isEditExpenseOpen, setIsEditExpenseOpen] = React.useState(false);
  const [isExpenseDetailsOpen, setIsExpenseDetailsOpen] = React.useState(false);
  const [selectedExpense, setSelectedExpense] = React.useState<ExpenseRow | null>(null);
  const [expenseSearchInput, setExpenseSearchInput] = React.useState("");
  const debouncedExpenseSearch = useDebouncedValue(expenseSearchInput, 350);
  const [expenseSortValue, setExpenseSortValue] = React.useState<ExpensesTableSortValue>("created-desc");
  const [expensePagination, setExpensePagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const expenseSort = React.useMemo(() => getExpenseSort(expenseSortValue), [expenseSortValue]);
  const expensePage = expensePagination.pageIndex + 1;
  const expensePerPage = expensePagination.pageSize;

  const handleExpenseSearchInputChange = React.useCallback((value: string) => {
    setExpenseSearchInput(value);
    setExpensePagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handleExpenseSortValueChange = React.useCallback((value: ExpensesTableSortValue) => {
    setExpenseSortValue(value);
    setExpensePagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const financeSummaryQuery = useQuery({
    queryKey: [`event-${id}-finance`],
    queryFn: () => getEventFinanceSummary(id),
    enabled: Boolean(id),
  });

  const expensesListQuery = useQuery({
    queryKey: [
      `event-${id}-expenses`,
      expensePage,
      expensePerPage,
      debouncedExpenseSearch,
      expenseSort.sortBy,
      expenseSort.sortOrder,
    ],
    queryFn: () =>
      getEventExpensesList(id, {
        page: expensePage,
        perPage: expensePerPage,
        q: debouncedExpenseSearch.trim() ? debouncedExpenseSearch.trim() : undefined,
        sortBy: expenseSort.sortBy,
        sortOrder: expenseSort.sortOrder,
      }),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  });

  const summaryErrorMessage =
    financeSummaryQuery.isError && !financeSummaryQuery.data
      ? financeSummaryQuery.error instanceof Error
        ? financeSummaryQuery.error.message
        : "Could not load event finance data."
      : undefined;
  const expensesTableErrorMessage =
    expensesListQuery.isError && !expensesListQuery.data
      ? expensesListQuery.error instanceof Error
        ? expensesListQuery.error.message
        : "Could not load event expenses."
      : undefined;

  const refreshExpenseData = React.useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [`event-${id}-expenses`] }),
      queryClient.invalidateQueries({ queryKey: [`event-${id}-finance`] }),
    ]);
  }, [id, queryClient]);

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => deleteEventExpense(id, expenseId),
    onSuccess: async () => {
      await refreshExpenseData();
      setIsDeleteExpenseDialogOpen(false);
      setIsExpenseDetailsOpen(false);
      setSelectedExpense(null);
      toast.success("Expense deleted", {
        description: "The expense has been removed successfully.",
      });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Could not delete expense.";
      setIsDeleteExpenseDialogOpen(false);
      toast.error("Could not delete expense", { description: message });
    },
  });

  const handleExpenseCreated = React.useCallback(async () => {
    await refreshExpenseData();
  }, [refreshExpenseData]);

  const handleExpenseUpdated = React.useCallback(async () => {
    await refreshExpenseData();
    setIsEditExpenseOpen(false);
    setIsExpenseDetailsOpen(false);
    setSelectedExpense(null);
  }, [refreshExpenseData]);

  const handleExpenseRowClick = React.useCallback((expense: ExpenseRow) => {
    setSelectedExpense(expense);
    setIsExpenseDetailsOpen(true);
  }, []);

  const handleExpenseDetailsOpenChange = React.useCallback((nextOpen: boolean) => {
    setIsExpenseDetailsOpen(nextOpen);
  }, []);

  const handleEditExpenseOpenChange = React.useCallback((nextOpen: boolean) => {
    setIsEditExpenseOpen(nextOpen);
  }, []);

  const handleDeleteExpenseDialogOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (deleteExpenseMutation.isPending) return;
      setIsDeleteExpenseDialogOpen(nextOpen);
    },
    [deleteExpenseMutation.isPending],
  );

  const handleEditExpenseClick = React.useCallback(() => {
    if (!selectedExpense) return;
    setIsEditExpenseOpen(true);
  }, [selectedExpense]);

  const handleDeleteExpenseClick = React.useCallback(() => {
    if (!selectedExpense) return;
    setIsDeleteExpenseDialogOpen(true);
  }, [selectedExpense]);

  const handleConfirmDeleteExpense = React.useCallback(() => {
    if (!selectedExpense?.id) return;
    deleteExpenseMutation.mutate(selectedExpense.id);
  }, [deleteExpenseMutation, selectedExpense]);

  React.useEffect(() => {
    if (!selectedExpense) return;

    const refreshedExpense = expensesListQuery.data?.data.find((expense) => expense.id === selectedExpense.id);
    if (refreshedExpense) {
      setSelectedExpense(refreshedExpense);
    }
  }, [expensesListQuery.data?.data, selectedExpense]);

  React.useEffect(() => {
    if (!isDeleteExpenseDialogOpen && !isEditExpenseOpen && !isExpenseDetailsOpen) {
      setSelectedExpense(null);
    }
  }, [isDeleteExpenseDialogOpen, isEditExpenseOpen, isExpenseDetailsOpen]);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <Expenses
          expensesTable={{
            data: expensesListQuery.data?.data ?? [],
            errorMessage: expensesTableErrorMessage,
            isFetching: expensesListQuery.isFetching,
            isLoading: expensesListQuery.isLoading && !expensesListQuery.data,
            onPaginationChange: (updater) => {
              setExpensePagination((old) => {
                const next = typeof updater === "function" ? updater(old) : updater;
                if (next.pageSize !== old.pageSize) {
                  return { ...next, pageIndex: 0 };
                }
                return next;
              });
            },
            onRetry: () => expensesListQuery.refetch(),
            onRowClick: handleExpenseRowClick,
            onSearchInputChange: handleExpenseSearchInputChange,
            onSortValueChange: handleExpenseSortValueChange,
            pageCount: Math.max(1, expensesListQuery.data?.meta.total_pages ?? 1),
            pagination: expensePagination,
            searchInput: expenseSearchInput,
            sortValue: expenseSortValue,
            totalRows: expensesListQuery.data?.meta.total ?? 0,
          }}
          financeSummary={financeSummaryQuery.data}
          isSummaryLoading={financeSummaryQuery.isLoading && !financeSummaryQuery.data}
          onAddExpenseClick={() => setIsAddExpenseOpen(true)}
          onRetrySummary={() => financeSummaryQuery.refetch()}
          summaryErrorMessage={summaryErrorMessage}
        />
      </div>

      <AddExpenseModal
        eventId={id}
        open={isAddExpenseOpen}
        onExpenseSaved={handleExpenseCreated}
        onOpenChange={setIsAddExpenseOpen}
      />

      <AddExpenseModal
        eventId={id}
        expense={selectedExpense}
        open={isEditExpenseOpen}
        onExpenseSaved={handleExpenseUpdated}
        onOpenChange={handleEditExpenseOpenChange}
      />

      <DeleteExpenseDialog
        expense={selectedExpense}
        isPending={deleteExpenseMutation.isPending}
        open={isDeleteExpenseDialogOpen}
        onConfirm={handleConfirmDeleteExpense}
        onOpenChange={handleDeleteExpenseDialogOpenChange}
      />

      <ExpenseDetailsDrawer
        expense={selectedExpense}
        isDeletePending={deleteExpenseMutation.isPending}
        onDeleteClick={handleDeleteExpenseClick}
        onEditClick={handleEditExpenseClick}
        open={isExpenseDetailsOpen}
        onOpenChange={handleExpenseDetailsOpenChange}
      />
    </div>
  );
}
