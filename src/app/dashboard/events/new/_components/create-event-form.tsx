"use client";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { DateTimePicker } from "@/components/date-time-picker";
import { ImageUpload } from "@/components/image-upload";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authFetch } from "@/lib/auth/auth-fetch";

const sharpInputClassName = "rounded-md border-foreground/25";

const formSchema = z.object({
  name: z.string().min(1, { message: "Please enter an event name." }),
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

type CreateEventResponse = {
  id: string;
};

function toRFC3339FromDatetimeLocal(value: string): string {
  // `datetime-local` returns `YYYY-MM-DDTHH:mm` (no timezone).
  // We treat it as local time and convert to an RFC3339 string with timezone offset via Date.
  // If parsing fails, return the raw string and let the backend validate.
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
}

async function postCreateEvent(input: FormInput): Promise<CreateEventResponse> {
  const payload = {
    name: input.name,
    image_url: input.image_url.trim(),
    description: input.description?.trim() ? input.description.trim() : undefined,
    event_date: toRFC3339FromDatetimeLocal(input.event_date),
    venue_name: input.venue_name,
    venue_address: input.venue_address,
    amount_in_kobo: input.amount_in_kobo,
    registration_opens_at: toRFC3339FromDatetimeLocal(input.registration_opens_at),
    registration_closes_at: input.registration_closes_at?.trim()
      ? toRFC3339FromDatetimeLocal(input.registration_closes_at)
      : undefined,
  };

  const res = await authFetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Could not create event. Please try again.";
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

  const json = (await res.json()) as unknown;
  const parsed = z.object({ id: z.string().min(1) }).safeParse(json);
  if (!parsed.success) {
    throw new Error("Event created, but received an unexpected response.");
  }
  return { id: parsed.data.id };
}

export function CreateEventForm({ footer }: { footer?: (args: { isPending: boolean }) => React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
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

  const mutation = useMutation({
    mutationFn: (input: FormInput) => postCreateEvent(input),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event created", { description: "Your event has been saved as a draft." });
      router.push(`/dashboard/events/${encodeURIComponent(data.id)}`);
    },
    onError: (err: Error) => {
      toast.error("Could not create event", { description: err.message });
    },
  });

  const onSubmit = (data: FormInput) => {
    mutation.mutate(data);
  };

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-8 p-6 md:p-8">
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
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
            value={mutation.isPending ? "Creating…" : "Create Event"}
            className={sharpInputClassName}
          />
        </FieldGroup>
      )}
    </form>
  );
}
