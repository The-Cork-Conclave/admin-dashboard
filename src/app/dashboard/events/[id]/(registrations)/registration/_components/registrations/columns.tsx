"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { format, parseISO, isValid } from "date-fns";
import { CircleAlertIcon, CircleCheckIcon, Clock3Icon, LoaderIcon, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

export const registrationColumns: ColumnDef<RegistrationRow>[] = [
  {
    accessorKey: "name",
    header: "Customer",
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
    cell: ({ row }) => (
      <Badge variant="outline" className="px-1.5 text-muted-foreground">
        {statusIcon(row.original.checked_in_at ? "checked_in" : row.original.status)}
        {(row.original.checked_in_at ? "checked_in" : row.original.status) === "pending_payment"
          ? "Pending"
          : (row.original.checked_in_at ? "checked_in" : row.original.status) === "checked_in"
            ? "Checked in"
            : row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "confirmed_at",
    header: "Paid On",
    cell: ({ row }) => {
      if (!row.original.confirmed_at) {
        return <span className="text-muted-foreground text-xs">—</span>;
      }

      const d = parseISO(row.original.confirmed_at);
      if (!row.original.confirmed_at || !isValid(d)) {
        return <span className="text-muted-foreground text-xs">—</span>;
      }

      return <span className="font-medium text-sm">{format(d, "do MMMM yyyy h:mm a")}</span>;
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

      return <span className="font-medium text-sm">{format(d, "do MMMM yyyy h:mm a")}</span>;
    },
  },
];
