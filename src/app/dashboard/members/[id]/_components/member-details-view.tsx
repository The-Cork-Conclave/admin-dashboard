"use client";

import * as React from "react";

import Link from "next/link";

import { useQuery } from "@tanstack/react-query";
import { Calendar, Mail, Phone, Search, Star, Wine } from "lucide-react";

import { StarRating } from "@/app/dashboard/events/[id]/_components/wines/_components/star-rating";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, getInitials } from "@/lib/utils";

import { getMember, type MemberDetailDTO, type MemberEventDTO } from "../_lib/api";
import { DeleteMemberButton } from "./delete-member-button";
import { EditMemberForm } from "./edit-member-form";

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
}

function memberSinceLabel(createdAt: string): string {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return "—";
  return `Member since ${new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(d)}`;
}

function AttendanceBadge({ status }: { status: MemberEventDTO["status"] }) {
  if (status === "checked_in") {
    return (
      <Badge variant="success" className="gap-1.5 uppercase tracking-wide">
        <span className="size-1.5 rounded-full bg-green-500" aria-hidden />
        Checked In
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1.5 uppercase tracking-wide">
      <span className="size-1.5 rounded-full bg-muted-foreground/40" aria-hidden />
      No Show
    </Badge>
  );
}

function ProfileHeader({ member }: { member: MemberDetailDTO }) {
  const [editOpen, setEditOpen] = React.useState(false);

  return (
    <>
      <Card>
        <CardContent className="flex flex-col items-start justify-between gap-6 pt-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-5">
            <Avatar className="size-20 border text-xl">
              <AvatarFallback className="bg-muted font-medium text-2xl text-primary">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-2">
              <h1 className="font-semibold text-2xl tracking-tight">{member.name}</h1>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-muted-foreground text-sm">
                <span className="inline-flex items-center gap-2">
                  <Mail className="size-4 shrink-0" aria-hidden />
                  {member.email}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Phone className="size-4 shrink-0" aria-hidden />
                  {member.phone_number}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Calendar className="size-4 shrink-0" aria-hidden />
                  {memberSinceLabel(member.created_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex w-full items-center gap-2 lg:w-auto">
            <Button className="flex-1 lg:flex-none" onClick={() => setEditOpen(true)}>
              Edit Member
            </Button>
            <DeleteMemberButton id={member.id} name={member.name} />
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="p-0 sm:max-w-md">
          <Card className="py-4 ring-0">
            <CardHeader className="border-b">
              <DialogHeader>
                <DialogTitle>Edit member</DialogTitle>
              </DialogHeader>
            </CardHeader>
            <CardContent className="py-4">
              <EditMemberForm
                memberId={member.id}
                defaultValues={{
                  name: member.name,
                  email: member.email,
                  phone_number: member.phone_number,
                }}
                onSuccess={() => setEditOpen(false)}
              />
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
}

function QuickStats({ member }: { member: MemberDetailDTO }) {
  return (
    <Card className="py-4 shadow-xs">
      <CardHeader className="px-4">
        <CardTitle>Quick Stats</CardTitle>
        <CardDescription>Attendance, reviews, and recent activity at a glance</CardDescription>
      </CardHeader>
      <CardContent className="mt-2 grid grid-cols-2 gap-4 px-4 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:[&>div:first-child]:pl-0 lg:[&>div:last-child]:pr-0 lg:[&>div]:px-5">
        <div className="space-y-1">
          <div className="text-muted-foreground text-sm">Events Attended</div>
          <div className="font-semibold text-2xl tabular-nums">{member.events_attended}</div>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground text-sm">Wines Reviewed</div>
          <div className="font-semibold text-2xl tabular-nums">{member.wines_reviewed}</div>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground text-sm">Avg Rating</div>
          <div className="inline-flex items-baseline gap-1.5 font-semibold text-2xl tabular-nums">
            {member.avg_rating.toFixed(1)}
            <Star className="size-4 fill-amber-500 text-amber-500" aria-hidden />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground text-sm">Last Event</div>
          <div className="truncate font-semibold text-base leading-tight">{member.last_event?.name ?? "—"}</div>
          <div className="text-muted-foreground text-sm">{formatDate(member.last_event?.event_date)}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function EventHistory({ member }: { member: MemberDetailDTO }) {
  const events = member.events;

  return (
    <Card className="overflow-hidden py-0">
      <CardHeader className="border-b py-6">
        <CardTitle>Event History</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full border bg-muted">
              <Calendar className="size-7 text-muted-foreground" />
            </div>
            <h4 className="mb-1 font-medium text-base">No events attended</h4>
            <p className="max-w-sm text-muted-foreground text-sm">
              This member hasn&apos;t registered for or attended any events yet.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="font-medium">{event.name}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(event.event_date)}</TableCell>
                  <TableCell>
                    <AttendanceBadge status={event.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function WineReviews({ member }: { member: MemberDetailDTO }) {
  const [search, setSearch] = React.useState("");

  const reviews = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return member.reviews;
    return member.reviews.filter(
      (r) =>
        r.wine_name.toLowerCase().includes(q) ||
        r.producer.toLowerCase().includes(q) ||
        (r.comment ?? "").toLowerCase().includes(q) ||
        r.event_name.toLowerCase().includes(q),
    );
  }, [member.reviews, search]);

  return (
    <Card className="overflow-hidden py-0">
      <CardHeader className="gap-4 space-y-0 border-b py-6 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <CardTitle>Wine Reviews</CardTitle>
        </div>
        <CardAction className="w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reviews..."
              className="pl-9"
            />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full border bg-muted">
              <Star className="size-7 text-muted-foreground" />
            </div>
            <h4 className="mb-1 font-medium text-base">No reviews yet</h4>
            <p className="max-w-sm text-muted-foreground text-sm">
              This member hasn&apos;t reviewed any wines from their attended events.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {reviews.map((review) => (
              <div key={review.id} className="p-6 transition-colors hover:bg-muted/40 md:p-8">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="mb-1 font-medium text-lg tracking-tight">{review.wine_name}</h4>
                    <p className="text-muted-foreground text-xs uppercase tracking-widest">{review.producer}</p>
                  </div>
                  <div className="inline-flex shrink-0 items-center gap-1.5 rounded-md border bg-muted/50 px-2.5 py-1.5">
                    <StarRating rating={review.rating} size="md" />
                    <span className="font-semibold text-xs tabular-nums">{review.rating.toFixed(1)}</span>
                  </div>
                </div>
                {review.comment ? (
                  <p className="max-w-3xl text-muted-foreground text-sm leading-relaxed">{review.comment}</p>
                ) : null}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Badge variant="outline" className="gap-1.5 font-normal">
                    <Wine className="size-3.5 text-muted-foreground" />
                    {review.event_name}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    {formatDateTime(review.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MemberDetailsSkeleton() {
  return (
    <main className="mx-auto w-full max-w-[1400px] space-y-8 px-6 py-6 md:px-10 md:py-8">
      <Skeleton className="h-5 w-48" />
      <Card>
        <CardContent className="flex items-center gap-5 pt-6">
          <Skeleton className="size-20 rounded-full" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
        </CardContent>
      </Card>
      <Skeleton className="h-36 w-full" />
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <Skeleton className="h-64 xl:col-span-6" />
        <Skeleton className="h-64 xl:col-span-6" />
      </div>
    </main>
  );
}

export function MemberDetailsView({ memberId }: { memberId: string }) {
  const query = useQuery({
    queryKey: ["member", memberId],
    queryFn: () => getMember(memberId),
    enabled: Boolean(memberId?.trim()),
  });

  if (query.isLoading) {
    return <MemberDetailsSkeleton />;
  }

  if (query.isError || !query.data) {
    return (
      <main className="mx-auto w-full max-w-[1400px] space-y-4 px-6 py-6 md:px-10 md:py-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Members</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Member</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-medium text-sm">Could not load this member</p>
            <p className="mt-1 text-muted-foreground text-sm">
              {query.error instanceof Error ? query.error.message : "Please try again."}
            </p>
            <Button className="mt-4" variant="outline" asChild>
              <Link href="/dashboard">Back to members</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const member = query.data;

  return (
    <main className="mx-auto w-full max-w-[1400px] space-y-8 px-6 py-6 md:px-10 md:py-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Members</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{member.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <ProfileHeader member={member} />
      <QuickStats member={member} />

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="space-y-8 xl:col-span-6">
          <EventHistory member={member} />
        </div>
        <div className="space-y-8 xl:col-span-6">
          <WineReviews member={member} />
        </div>
      </div>
    </main>
  );
}
