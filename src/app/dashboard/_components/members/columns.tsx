"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { isValid, format, parseISO } from "date-fns";
import { UserRound } from "lucide-react";
import type { MembersRow } from "./schema";

export const membersColumn: ColumnDef<MembersRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-md border bg-muted">
          <UserRound className="size-4 text-muted-foreground" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-end justify-between gap-3">
            <div className="grid min-w-0 gap-0.5">
              <span className="truncate font-medium text-sm leading-none">{row.original.name}</span>
            </div>
          </div>
        </div>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="flex flex-col gap-2">
        <span className="truncate font-medium text-sm leading-none">{row.original.email}</span>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "phone_number",
    header: "Phone Number",
    cell: ({ row }) => (
      <div className="flex flex-col gap-2">
        <span className="truncate font-medium text-sm leading-none">{row.original.phone_number}</span>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "number_of_events",
    header: "Number of Events",
    cell: ({ row }) => {
      return <span className="truncate font-medium text-sm leading-none">{row.original.number_of_events}</span>;
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
