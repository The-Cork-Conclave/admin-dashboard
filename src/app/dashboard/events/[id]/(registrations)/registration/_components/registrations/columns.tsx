"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { isValid, parseISO } from "date-fns";
import { CircleAlertIcon, CircleCheckIcon, Clock3Icon, Eye, LoaderIcon, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  formatRegistrationDate,
  formatRegistrationStatusLabel,
  getEffectiveRegistrationStatus,
} from "./registration-display";
import type { RegistrationRow } from "./schema";

function statusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "confirmed":
      return <CircleCheckIcon className="fill-green-500 stroke-primary-foreground dark:fill-green-600" />;
    case "checked_in":
      return <CircleCheckIcon className="fill-primary stroke-primary-foreground" />;
    case "pending_payment":
      return <LoaderIcon />;
    case "cancelled":
      return <CircleAlertIcon className="text-amber-600 dark:text-amber-500" />;
    case "expired":
      return <Clock3Icon className="text-muted-foreground" />;
    default:
      return null;
  }
}

export function getRegistrationColumns(opts: { onView: (row: RegistrationRow) => void }): ColumnDef<RegistrationRow>[] {
  return [
    {
      accessorKey: "name",
      header: "Member",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md border bg-muted">
            <UserRound className="size-4 text-muted-foreground" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-end justify-between gap-3">
              <div className="grid min-w-0 gap-0.5">
                <span className="truncate font-medium text-sm leading-none">{row.original.name}</span>
                <span className="truncate text-muted-foreground text-xs leading-none">{row.original.email}</span>
              </div>
            </div>
          </div>
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "status",
      header: "Status",
      filterFn: "equalsString",
      cell: ({ row }) => {
        const effectiveStatus = getEffectiveRegistrationStatus(row.original);

        return (
          <Badge variant="outline" className="px-1.5 text-muted-foreground">
            {statusIcon(effectiveStatus)}
            {formatRegistrationStatusLabel(effectiveStatus)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "confirmed_at",
      header: "Paid On",
      cell: ({ row }) => {
        const formatted = formatRegistrationDate(row.original.confirmed_at);
        if (formatted === "—") {
          return <span className="text-muted-foreground text-xs">—</span>;
        }

        return <span className="font-medium text-sm">{formatted}</span>;
      },
    },
    {
      accessorKey: "created_at",
      header: "Registered On",
      cell: ({ row }) => {
        const d = parseISO(row.original.created_at);

        if (!isValid(d)) {
          return <span className="text-muted-foreground text-xs">—</span>;
        }

        return <span className="font-medium text-sm">{formatRegistrationDate(row.original.created_at)}</span>;
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            opts.onView(row.original);
          }}
        >
          <Eye className="size-4" />
          View
        </Button>
      ),
      enableHiding: false,
    },
  ];
}
