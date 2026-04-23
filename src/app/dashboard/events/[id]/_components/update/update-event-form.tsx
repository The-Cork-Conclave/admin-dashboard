"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { type EventDTO, getEventClient } from "@/app/dashboard/events/[id]/_lib/get-event.client";
import { DateTimePicker } from "@/components/date-time-picker";
import { AmountInput } from "@/components/amount-input";
import { ImageUpload } from "@/components/image-upload";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { authFetch } from "@/lib/auth/auth-fetch";

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
  welcome_text: z.string().optional(),
  dress_code: z.string().optional(),
  entry_fee: z.string().optional(),
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
  const toNullableTrimmedString = (v: string | undefined): string | null | undefined => {
    if (typeof v !== "string") return undefined;
    const t = v.trim();
    return t ? t : null;
  };

  const payload: Record<string, unknown> = {
    name: input.name,
    status: input.status,
    image_url: input.image_url.trim(),
    description: input.description?.trim(),
    welcome_text: toNullableTrimmedString(input.welcome_text),
    dress_code: toNullableTrimmedString(input.dress_code),
    entry_fee: toNullableTrimmedString(input.entry_fee),
    event_date: toRFC3339FromDatetimeLocal(input.event_date),
    venue_name: input.venue_name,
    venue_address: input.venue_address,
    amount_in_kobo: input.amount_in_kobo,
    registration_opens_at: toRFC3339FromDatetimeLocal(input.registration_opens_at),
    registration_closes_at: input.registration_closes_at?.trim()
      ? toRFC3339FromDatetimeLocal(input.registration_closes_at)
      : undefined,
  };

  const res = await authFetch(`/api/events/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
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
      image_url: "",
      description: "",
      welcome_text: "",
      dress_code: "",
      entry_fee: "",
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
    const parsedStatus = statusSchema.parse(event.status);

    form.reset({
      name: event.name ?? "",
      status: parsedStatus,
      image_url: event.image_url ?? "",
      description: event.description ?? "",
      welcome_text: event.welcome_text ?? "",
      dress_code: event.dress_code ?? "",
      entry_fee: event.entry_fee ?? "",
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
      <div className="space-y-8 p-6 md:p-8">
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
          <div className="md:col-span-2 flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-2/3">
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

            <div className="w-full md:w-1/3">
              <Controller
                control={form.control}
                name="status"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="event-status">Status</FieldLabel>
                    <Select
                      key={field.value ?? "unset"}
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={mutation.isPending}
                    >
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
              name="welcome_text"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="event-welcome-text">Welcome Text</FieldLabel>
                  <Textarea
                    {...field}
                    id="event-welcome-text"
                    rows={4}
                    placeholder="Optional (e.g. It's 1804 once again, and The Cork Conclave is here again!)"
                    aria-invalid={fieldState.invalid}
                    disabled={mutation.isPending}
                    className={`${sharpInputClassName} resize-none`}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          <div className="md:col-span-2 flex flex-col md:flex-row gap-8">
            <div className="w-full">
              <Controller
                control={form.control}
                name="dress_code"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="event-dress-code">Dress Code</FieldLabel>
                    <Textarea
                      {...field}
                      id="event-dress-code"
                      rows={3}
                      placeholder="Optional (e.g. Dress like a Nigerian in 1804)."
                      aria-invalid={fieldState.invalid}
                      disabled={mutation.isPending}
                      className={`${sharpInputClassName} resize-none`}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <div className="w-full">
              <Controller
                control={form.control}
                name="entry_fee"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="event-entry-fee">Entry Fee</FieldLabel>
                    <Textarea
                      {...field}
                      id="event-entry-fee"
                      placeholder="e.g. A bottle of your favourite wine."
                      rows={2}
                      aria-invalid={fieldState.invalid}
                      disabled={mutation.isPending}
                      className={`${sharpInputClassName} resize-none`}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
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
                <AmountInput
                  id="amount-in-kobo"
                  placeholder="e.g. 5000"
                  aria-invalid={fieldState.invalid}
                  disabled={mutation.isPending}
                  className={sharpInputClassName}
                  value={String(field.value ?? "")}
                  onChange={(digitsOnly) => field.onChange(digitsOnly)}
                  ref={field.ref}
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
