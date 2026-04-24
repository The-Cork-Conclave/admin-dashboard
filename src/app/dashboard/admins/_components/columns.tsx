"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { format, isValid, parseISO } from "date-fns";
import { CircleAlertIcon, CircleCheckIcon, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AdminRow } from "./schema";

function statusIcon(valid: boolean) {
  return valid ? (
    <CircleCheckIcon className="fill-green-500 stroke-primary-foreground dark:fill-green-600" />
  ) : (
    <CircleAlertIcon className="text-amber-600 dark:text-amber-500" />
  );
}

export const adminColumns: ColumnDef<AdminRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-md border bg-muted">
          <UserRound className="size-4 text-muted-foreground" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm">{row.original.name}</p>
        </div>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      return <p className="font-medium text-sm">{row.original.email}</p>;
    },
  },

  {
    accessorKey: "status",
    header: "Status",
    filterFn: "equalsString",
    cell: ({ row }) => {
      const verifiedAt = parseISO(row.original.verified_at);
      const isVerified =
        Boolean(row.original.verified_at?.trim()) && isValid(verifiedAt) && verifiedAt.getFullYear() > 1;
      return (
        <Badge variant="outline" className="px-1.5 text-muted-foreground">
          {statusIcon(isVerified)}
          {isVerified ? "Verified" : "Unverified"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => {
      const d = parseISO(row.original.created_at);
      if (!isValid(d)) {
        return <span className="text-muted-foreground text-xs">—</span>;
      }
      return (
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{format(d, "do MMMM yyyy")}</span>
          <span className="text-muted-foreground text-xs">at {format(d, "h:mm a")}</span>
        </div>
      );
    },
  },
];
