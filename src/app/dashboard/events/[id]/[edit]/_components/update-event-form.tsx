"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { DateTimePicker } from "@/components/date-time-picker";
import { ImageUpload } from "@/components/image-upload";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRoutes } from "@/lib/routes";
import { EventDTO, getEventClient } from "@/app/dashboard/events/[id]/_lib/get-event.client";

const sharpInputClassName = "rounded-md border-foreground/25";

const statusSchema = z.enum(["draft", "active", "closed", "completed", "cancelled"]);

const formSchema = z.object({
  name: z.string().min(1, { message: "Please enter an event name." }),
  status: statusSchema,
  image_url: z
    .string()
    .min(1, { message: "Please upload an event image." })
    .url({ message: "Please upload a valid image URL." }),
  description: z.string().optional(),
  event_date: z.string().min(1, { message: "Please select an event date." }),
  amount_in_kobo: z
    .string()
    .min(1, { message: "Please enter an amount in naira." })
    .refine((v) => /^\d+$/.test(v), { message: "Amount must be a whole number (kobo)." }),
  venue_name: z.string().min(1, { message: "Please enter a venue name." }),
  venue_address: z.string().min(1, { message: "Please enter a venue address." }),
  registration_opens_at: z.string().min(1, { message: "Please select when registration opens." }),
  registration_closes_at: z.string().optional(),
});

type FormInput = z.infer<typeof formSchema>;

function toRFC3339FromDatetimeLocal(value: string): string {
  // `datetime-local` returns `YYYY-MM-DDTHH:mm` (no timezone).
  // We treat it as local time and convert to an RFC3339 string with timezone offset via Date.
  // If parsing fails, return the raw string and let the backend validate.
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
}

function toDatetimeLocalFromRFC3339(value: string | undefined): string {
  const v = (value ?? "").trim();
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";

  const pad2 = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const min = pad2(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function nairaStringFromKoboString(kobo: string | undefined): string {
  const raw = (kobo ?? "").trim();
  if (!raw) return "";
  const n = Number(raw);
  if (!Number.isFinite(n)) return "";
  return String(Math.round(n / 100));
}

async function patchUpdateEvent(id: string, input: FormInput): Promise<void> {
  const payload: Record<string, unknown> = {
    name: input.name,
    status: input.status,
    image_url: input.image_url.trim(),
    description: input.description?.trim(),
    event_date: toRFC3339FromDatetimeLocal(input.event_date),
    venue_name: input.venue_name,
    venue_address: input.venue_address,
    amount_in_kobo: input.amount_in_kobo,
    registration_opens_at: toRFC3339FromDatetimeLocal(input.registration_opens_at),
    registration_closes_at: input.registration_closes_at?.trim()
      ? toRFC3339FromDatetimeLocal(input.registration_closes_at)
      : undefined,
  };

  const res = await fetch(apiRoutes.events.byId(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Could not update event. Please try again.";
    try {
      const body = (await res.json()) as { message?: string };
      if (typeof body.message === "string" && body.message.length > 0) {
        message = body.message;
      }
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
}

export function UpdateEventForm({
  footer,
  id,
}: {
  footer?: (args: { isPending: boolean }) => React.ReactNode;
  id: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEventClient(id),
    enabled: Boolean(id),
  });

  const event: EventDTO | undefined = query.data?.event;

  const form = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      status: "draft",
      image_url: "",
      description: "",
      event_date: "",
      amount_in_kobo: "",
      venue_name: "",
      venue_address: "",
      registration_opens_at: "",
      registration_closes_at: "",
    },
  });

  useEffect(() => {
    if (!event) return;
    form.reset({
      name: event.name ?? "",
      status: statusSchema.catch("draft").parse(event.status),
      image_url: event.image_url ?? "",
      description: event.description ?? "",
      event_date: toDatetimeLocalFromRFC3339(event.event_date),
      amount_in_kobo: nairaStringFromKoboString(event.amount_in_kobo),
      venue_name: event.venue_name ?? "",
      venue_address: event.venue_address ?? "",
      registration_opens_at: toDatetimeLocalFromRFC3339(event.registration_opens_at),
      registration_closes_at: toDatetimeLocalFromRFC3339(event.registration_closes_at),
    });
  }, [event, form]);

  const mutation = useMutation({
    mutationFn: (input: FormInput) => patchUpdateEvent(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      await queryClient.invalidateQueries({ queryKey: ["event", id] });
      toast.success("Event updated", { description: "Your changes have been saved." });
      router.push(`/dashboard/events/${encodeURIComponent(id)}`);
    },
    onError: (err: Error) => {
      toast.error("Could not update event", { description: err.message });
    },
  });

  const onSubmit = (data: FormInput) => {
    mutation.mutate(data);
  };

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <div className="p-6 md:p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
          <div className="md:col-span-2">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="event-name">Event Name</FieldLabel>
                  <Input
                    {...field}
                    id="event-name"
                    placeholder="Please enter the event name"
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                    disabled={mutation.isPending}
                    className={sharpInputClassName}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          <div className="md:col-span-2">
            <Controller
              control={form.control}
              name="status"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="event-status">Status</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={mutation.isPending}>
                    <SelectTrigger id="event-status" className={`${sharpInputClassName} w-full`}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          <div className="md:col-span-2">
            <Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="event-description">Description</FieldLabel>
                  <Textarea
                    {...field}
                    id="event-description"
                    rows={6}
                    placeholder="Provide details about the event description..."
                    aria-invalid={fieldState.invalid}
                    disabled={mutation.isPending}
                    className={`${sharpInputClassName} resize-none`}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          <div className="md:col-span-2">
            <Controller
              control={form.control}
              name="image_url"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel>Event Image</FieldLabel>
                  <ImageUpload
                    value={field.value}
                    onChange={(url) => field.onChange(url)}
                    folder="cork-conclave/events"
                    disabled={mutation.isPending}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          <Controller
            control={form.control}
            name="event_date"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="event-date">Event Date</FieldLabel>
                <DateTimePicker
                  id="event-date"
                  value={field.value}
                  onChange={field.onChange}
                  aria-invalid={fieldState.invalid}
                  disabled={mutation.isPending}
                  className={sharpInputClassName}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="amount_in_kobo"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="amount-in-kobo">Amount (₦)</FieldLabel>
                <Input
                  {...field}
                  id="amount-in-kobo"
                  inputMode="numeric"
                  pattern="\\d*"
                  placeholder="e.g. 5000"
                  aria-invalid={fieldState.invalid}
                  disabled={mutation.isPending}
                  className={sharpInputClassName}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <div className="md:col-span-2">
            <Controller
              control={form.control}
              name="venue_name"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="venue-name">Venue Name</FieldLabel>
                  <Input
                    {...field}
                    id="venue-name"
                    placeholder="e.g. Grand Convention Hall"
                    aria-invalid={fieldState.invalid}
                    disabled={mutation.isPending}
                    className={sharpInputClassName}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          <div className="md:col-span-2">
            <Controller
              control={form.control}
              name="venue_address"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="venue-address">Venue Address (preferably an address with a map link)</FieldLabel>
                  <Input
                    {...field}
                    id="venue-address"
                    placeholder="e.g. 123 Convention Way, City District..."
                    aria-invalid={fieldState.invalid}
                    disabled={mutation.isPending}
                    className={sharpInputClassName}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          <Controller
            control={form.control}
            name="registration_opens_at"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="registration-opens-at">Registration Opens</FieldLabel>
                <DateTimePicker
                  id="registration-opens-at"
                  value={field.value}
                  onChange={field.onChange}
                  aria-invalid={fieldState.invalid}
                  disabled={mutation.isPending}
                  className={sharpInputClassName}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="registration_closes_at"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="registration-closes-at">Registration Closes</FieldLabel>
                <DateTimePicker
                  id="registration-closes-at"
                  value={field.value}
                  onChange={field.onChange}
                  aria-invalid={fieldState.invalid}
                  disabled={mutation.isPending}
                  className={sharpInputClassName}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      </div>

      {footer?.({ isPending: mutation.isPending }) ?? (
        <FieldGroup className="px-6 pb-6 md:px-8 md:pb-8">
          <Input
            type="submit"
            value={mutation.isPending ? "Saving…" : "Save Changes"}
            className={sharpInputClassName}
          />
        </FieldGroup>
      )}
    </form>
  );
}

