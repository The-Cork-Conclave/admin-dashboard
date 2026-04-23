"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Keyboard, MapPin, MoveLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Registrations from "./registrations";
import { type EventDTO, getEventClient } from "@/app/dashboard/events/[id]/_lib/get-event.client";
import { formatDateTime, formatTime } from "@/lib/utils";
import Link from "next/link";
import { checkinAttendee } from "../api";
import { formSchema, FormInput, CheckinResponse } from "../schema";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { QrScanner } from "@/components/qr-scanner";
import { decodeQrPayload } from "@/lib/qr-payload";

export default function RegistrationPage({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const [details, setDetails] = useState<CheckinResponse>({
    checkin_at: "",
    name: "",
    ticket_id: "",
  });

  const query = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEventClient(id),
    enabled: Boolean(id),
  });

  const event: EventDTO | undefined = query.data?.event;

  const form = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      access_code: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (input: FormInput) => checkinAttendee(id, input),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["event", id] });
      await queryClient.invalidateQueries({ queryKey: [`events-${id}-registrations`] });
      setDetails(data);
      form.reset();
      toast.success("Check-in Successful");
    },
    onError: (err: Error) => {
      form.reset();
      toast.error("Error checking in", { description: err.message });
    },
  });

  const onSubmit = (data: FormInput) => {
    mutation.mutate(data);
  };

  const onScanText = (text: string) => {
    try {
      const payload = decodeQrPayload(text);
      if (payload.event_id !== id) {
        toast.error("Wrong event");
        return;
      }

      form.setValue("access_code", payload.access_code, { shouldValidate: true });
      mutation.mutate({ access_code: payload.access_code });
    } catch (e) {
      toast.error("Invalid QR code", { description: e instanceof Error ? e.message : "Could not decode QR payload." });
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <Link href={`/dashboard/events/${event?.id}`}>
          <Button variant="link" size="sm" className="gap-2">
            <MoveLeft className="size-4" />
            Back
          </Button>
        </Link>
      </div>
      <header className="flex flex-col justify-between gap-4 border-b pb-2 sm:flex-row sm:items-end">
        <div>
          <div className="mb-1.5 flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{event?.name ?? ""}</h1>
          </div>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            <span className="mr-2">{formatDateTime(event?.event_date)}</span> •
            <span className="ml-2">{event?.venue_name}</span>
          </p>
        </div>

        {event?.status === "active" && (
          <Card size="sm" className="w-fit gap-2 px-4 py-3">
            <CardContent className="p-0">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-medium text-muted-foreground">Attendees Checked In</span>
                  <span className="font-semibold tracking-tight">{event?.checked_in_count ?? 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {event?.status === "active" && (
          <section className="flex flex-col gap-6 lg:col-span-7">
            <QrScanner
              disabled={mutation.isPending}
              onScanText={onScanText}
              helperContent={
                <div className="space-y-1 text-center">
                  <p className="text-sm font-medium">Scan attendee QR code to check in</p>
                  <p className="text-xs text-muted-foreground">
                    Having trouble scanning? Enter code manually on the right.
                  </p>
                </div>
              }
            />
          </section>
        )}

        {event?.status === "active" && (
          <aside className="flex flex-col gap-6 lg:col-span-5">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Keyboard className="size-4 text-muted-foreground" />
                  Manual Entry
                </CardTitle>
              </CardHeader>

              <CardContent className="p-5">
                <form className="space-y-3" noValidate onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="md:col-span-2">
                    <Controller
                      control={form.control}
                      name="access_code"
                      render={({ field, fieldState }) => (
                        <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                          <Input
                            {...field}
                            id="access_code"
                            placeholder="Enter 6-digit access code"
                            autoComplete="off"
                            aria-invalid={fieldState.invalid}
                            disabled={mutation.isPending}
                            className="h-10 uppercase tracking-widest"
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </div>

                  <FieldGroup className="w-full">
                    <Button type="submit" className="h-10 w-full">
                      {mutation.isPending ? "Checking In..." : "Check In"}
                    </Button>
                  </FieldGroup>
                </form>
              </CardContent>
            </Card>

            {!!details.ticket_id && (
              <Card className="relative overflow-hidden ring-1 ring-green-500/10">
                <div className="absolute left-0 top-0 h-1 w-full bg-green-500" />
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-green-50 ring-4 ring-green-50/50">
                    <CheckCircle2 className="size-6 text-green-600" />
                  </div>
                  <h3 className="mb-1 text-lg font-semibold tracking-tight">Check-in Successful</h3>
                  <p className="mb-5 text-sm text-muted-foreground">Attendee verified and granted access.</p>

                  <div className="w-full rounded-lg border bg-muted/30 p-4 text-left">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="mb-0.5 text-xs text-muted-foreground">Attendee</p>
                        <p className="text-sm font-medium">{details?.name}</p>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Ticket ID</span>
                        <span className="font-mono tracking-tight">{details?.ticket_id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Time</span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5 text-muted-foreground" />
                          {formatTime(details?.checkin_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>
        )}
      </div>

      <Registrations id={id} />
    </main>
  );
}

{
  /* <div className="mt-6 space-y-1 text-center">
<p className="text-sm font-medium">Scan attendee QR code to check in</p>
<p className="text-xs text-muted-foreground">
  Having trouble scanning? Enter code manually on the right.
</p>
</div> */
}
