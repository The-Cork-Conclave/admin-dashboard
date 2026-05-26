"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { format, isValid, parseISO } from "date-fns";

import type { JobRow, JobStatus, JobType } from "./schema";

function humanizeSnakeCase(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-green-200/60 bg-green-50 px-2 py-0.5 font-medium text-green-700 text-xs">
          Completed
        </span>
      );

    case "cancelled":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200/60 bg-slate-50 px-2 py-0.5 font-medium text-slate-700 text-xs">
          Cancelled
        </span>
      );

    case "failed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-red-200/60 bg-red-50 px-2 py-0.5 font-medium text-red-700 text-xs">
          Failed
        </span>
      );

    case "processing":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-yellow-200/60 bg-yellow-50 px-2 py-0.5 font-medium text-xs text-yellow-700">
          Processing
        </span>
      );

    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-gray-200/60 bg-gray-50 px-2 py-0.5 font-medium text-gray-700 text-xs">
          Pending
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200/60 bg-zinc-50 px-2 py-0.5 font-medium text-xs text-zinc-700">
          {humanizeSnakeCase(status)}
        </span>
      );
  }
}

export function JobName(name: JobType) {
  switch (name) {
    case "send_admin_invite_email":
      return "Send Admin Invite";
    case "send_admin_magic_link_email":
      return "Send Admin Login Link";
    case "send_event_registration_email":
      return "Send Event Registration Email";
    case "send_event_reminder_3_days":
      return "Send Event Reminder (3 days)";
    case "send_event_reminder_day_of":
      return "Send Event Reminder (day of)";
    case "verify_ercas_payment":
      return "Verify Ercas Payment";
    default:
      return humanizeSnakeCase(name);
  }
}

export const jobsColumns: ColumnDef<JobRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <p className="font-medium text-sm">{JobName(row.original.name)}</p>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <JobStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "attempts",
    header: "Attempts",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <p className="font-medium text-sm">{row.original.attempts}</p>
      </div>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => {
      if (!row.original.created_at) {
        return <span className="text-muted-foreground text-xs">—</span>;
      }
      const d = parseISO(row.original.created_at);

      if (!isValid(d)) {
        return <span className="text-muted-foreground text-xs">—</span>;
      }

      return <span className="font-medium text-muted-foreground text-sm">{format(d, "do MMMM yyyy h:mm:ss a")}</span>;
    },
  },
  {
    accessorKey: "run_at",
    header: "Run At",
    cell: ({ row }) => {
      const d = parseISO(row.original.run_at);
      if (!isValid(d)) {
        return <span className="text-muted-foreground text-xs">—</span>;
      }

      return <span className="font-medium text-muted-foreground text-sm">{format(d, "do MMMM yyyy h:mm:ss a")}</span>;
    },
  },
];
