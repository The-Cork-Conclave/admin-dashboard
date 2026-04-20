"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { PaginationState, Updater } from "@tanstack/react-table";
import * as React from "react";
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchAdminsList } from "../_lib/fetch-admins-list";
import { AdminsTableSkeleton } from "./admins-table-skeleton";
import { AdminsTable } from "./table";
import { InviteAdminForm } from "./invite-admin-form";


export function AdminsView() {
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const page = pagination.pageIndex + 1;
  const perPage = pagination.pageSize;

  const query = useQuery({
    queryKey: ["admins", page, perPage],
    queryFn: () => fetchAdminsList(page, perPage),
    placeholderData: keepPreviousData,
  });

  const onPaginationChange = React.useCallback((updater: Updater<PaginationState>) => {
    setPagination((old) => {
      const next = typeof updater === "function" ? updater(old) : updater;
      if (next.pageSize !== old.pageSize) {
        return { ...next, pageIndex: 0 };
      }
      return next;
    });
  }, []);

  const total = query.data?.meta.total ?? 0;
  const pageCount = Math.max(1, query.data?.meta.total_pages ?? 1);
  const isPending = query.isPending;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Card>
        <CardHeader className="w-full justify-between mb-4 align-middle">
          <CardTitle className="leading-none">Admins</CardTitle>
          <CardAction>
            <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
              <PlusIcon />
              Add Admin
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="pt-0">
          {query.isError ? (
            <p className="text-destructive text-sm" role="alert">
              {query.error instanceof Error ? query.error.message : "Could not load admins."}
            </p>
          ) : isPending ? (
            <AdminsTableSkeleton rowCount={pagination.pageSize} />
          ) : (
            <AdminsTable
              data={query.data?.data ?? []}
              isFetching={query.isFetching}
              pagination={pagination}
              pageCount={pageCount}
              totalRows={total}
              onPaginationChange={onPaginationChange}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="p-0 sm:max-w-md">
          <Card className="py-4 ring-0">
            <CardHeader className="border-b">
              <DialogHeader>
                <DialogTitle>Invite admin</DialogTitle>
              </DialogHeader>
            </CardHeader>
            <CardContent className="py-4">
              <InviteAdminForm onSuccess={() => setInviteOpen(false)} />
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  );
}
