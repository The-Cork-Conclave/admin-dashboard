"use client";
"use no memo";

import { JobRow } from "./schema";
import type { ColumnDef } from "@tanstack/react-table";
import { format, isValid, parseISO } from "date-fns";
import { type JobStatus, type JobType } from "./schema";

export function JobStatusBadge({ status }: { status: JobStatus }) {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-green-50 border border-green-200/60 px-2 py-0.5 text-xs font-medium text-green-700">
          Completed
        </span>
      );

    case "cancelled":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 border border-slate-200/60 px-2 py-0.5 text-xs font-medium text-slate-700">
          Cancelled
        </span>
      );

    case "failed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 border border-red-200/60 px-2 py-0.5 text-xs font-medium text-red-700">
          Failed
        </span>
      );

    case "processing":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-yellow-50 border border-yellow-200/60 px-2 py-0.5 text-xs font-medium text-yellow-700">
          Processing
        </span>
      );

    case "pending":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-50 border border-gray-200/60 px-2 py-0.5 text-xs font-medium text-gray-700">
          Pending
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
      return "";
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

      return <span className="font-medium text-sm text-muted-foreground">{format(d, "do MMMM yyyy h:mm:ss a")}</span>;
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

      return <span className="font-medium text-sm text-muted-foreground">{format(d, "do MMMM yyyy h:mm:ss a")}</span>;
    },
  },
];
