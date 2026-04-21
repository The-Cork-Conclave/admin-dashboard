"use client";
"use no memo";

import Image from "next/image";

import type { ColumnDef } from "@tanstack/react-table";
import { format, isValid, parseISO } from "date-fns";

import { EventStatusBadge } from "@/components/ui/badge";
import { formatNairaFromKobo } from "@/lib/utils";

import type { EventRow } from "./schema";

export const eventColumns: ColumnDef<EventRow>[] = [
  {
    accessorKey: "name",
    header: "Event",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Image
          src={row.original.image_url?.trim() ?? ""}
          alt="Banner"
          className="h-10 w-16 rounded-md border border-gray-200/60 bg-gray-50 object-cover shadow-sm"
          width={64}
          height={40}
        />
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
    accessorKey: "event_date",
    header: "Event Date",
    cell: ({ row }) => {
      const d = parseISO(row.original.event_date);
      if (!isValid(d)) {
        return <span className="text-muted-foreground text-xs">—</span>;
      }
      return <span className="font-medium text-sm">{format(d, "do MMMM yyyy h:mm a")}</span>;
    },
  },
  {
    accessorKey: "amount_in_kobo",
    header: "Price",
    cell: ({ row }) => {
      const amount = formatNairaFromKobo(row.original.amount_in_kobo);

      return <span className="font-medium text-sm">{amount.pretty}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: "equalsString",
    cell: ({ row }) => <EventStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "id",
    header: "Registration Window",
    cell: ({ row }) => {
      const opens_at = parseISO(row.original.registration_opens_at);
      const closes_at = parseISO(row.original.registration_closes_at);

      if (!isValid(opens_at) || !isValid(closes_at)) {
        return <span className="text-muted-foreground text-xs">—</span>;
      }

      return (
        <div className="flex items-center gap-2">
          <div className="flex items-end justify-between gap-3">
            <div className="grid min-w-0 gap-0.5">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-xs">Opens: </span>
                <span className="font-medium text-sm">{format(opens_at, "do MMMM yyyy")}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-xs">Closes: </span>
                <span className="font-medium text-sm">{format(closes_at, "do MMMM yyyy")}</span>
              </div>
            </div>
          </div>
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: "Attendees",
    cell: () => {
      return <span className="font-medium text-sm">{0}</span>;
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

      return <span className="font-medium text-sm">{format(d, "do MMMM yyyy h:mm a")}</span>;
    },
  },
];
