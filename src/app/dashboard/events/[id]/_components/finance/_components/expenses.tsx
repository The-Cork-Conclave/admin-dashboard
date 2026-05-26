"use client";

import type { PaginationState, Updater } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";

import type { EventFinanceSummaryDTO } from "../api";
import { BalanceDistributionCard } from "./balance";
import { ExpensesTableCard, type ExpensesTableCardProps, type ExpensesTableSortValue } from "./expenses-table";
import { TransactionsOverviewCard } from "./transactions-overview";

type ExpensesProps = {
  financeSummary?: EventFinanceSummaryDTO;
  summaryErrorMessage?: string;
  isSummaryLoading?: boolean;
  onAddExpenseClick?: () => void;
  onAddOpeningBalanceClick?: () => void;
  onRetrySummary?: () => void;
  expensesTable: {
    data: ExpensesTableCardProps["data"];
    errorMessage?: string;
    isFetching?: boolean;
    isLoading?: boolean;
    onAddExpenseClick?: () => void;
    onRowClick?: ExpensesTableCardProps["onRowClick"];
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
};

export default function Expenses({
  expensesTable,
  financeSummary,
  isSummaryLoading,
  onAddExpenseClick,
  onAddOpeningBalanceClick,
  onRetrySummary,
  summaryErrorMessage,
}: ExpensesProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <BalanceDistributionCard
            errorMessage={summaryErrorMessage}
            expensesInKobo={financeSummary?.expensesInKobo ?? 0}
            isLoading={isSummaryLoading}
            netBalanceInKobo={financeSummary?.netBalanceInKobo ?? 0}
            onRetry={onRetrySummary}
            previousBalanceInKobo={financeSummary?.metrics?.previous_balance_in_kobo}
            revenueInKobo={financeSummary?.revenueInKobo ?? 0}
          />
        </div>
        <div className="xl:col-span-7">
          <TransactionsOverviewCard
            errorMessage={summaryErrorMessage}
            isLoading={isSummaryLoading}
            metrics={financeSummary?.metrics}
            onRetry={onRetrySummary}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {onAddOpeningBalanceClick ? (
          <Button variant="outline" size="sm" onClick={onAddOpeningBalanceClick}>
            Opening balance
          </Button>
        ) : null}
      </div>

      <ExpensesTableCard {...expensesTable} onAddExpenseClick={onAddExpenseClick} />
    </div>
  );
}
