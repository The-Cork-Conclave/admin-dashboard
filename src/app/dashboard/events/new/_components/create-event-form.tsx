"use client";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { AmountInput } from "@/components/amount-input";
import { DateTimePicker } from "@/components/date-time-picker";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { type FormInput, formSchema, sharpInputClassName } from "./constants";

export function CreateEventForm({
  defaultValues,
  onNext,
}: {
  defaultValues?: FormInput;
  onNext: (data: FormInput) => void;
}) {
  const form = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ?? {
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

  return (
    <form
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      noValidate
      onSubmit={form.handleSubmit(onNext)}
    >
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
                    className={sharpInputClassName}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
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
                    className={`${sharpInputClassName} resize-none`}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </div>

          <div className="flex flex-col gap-8 md:col-span-2 md:flex-row">
            <div className="w-full">
              <Controller
                control={form.control}
                name="dress_code"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="event-dress-code">
                      Dress Code <span className="text-muted-foreground text-xs">(Optional)</span>
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id="event-dress-code"
                      rows={2}
                      placeholder="e.g. Dress like a Nigerian in 1804."
                      aria-invalid={fieldState.invalid}
                      className={`${sharpInputClassName} resize-none`}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
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
                    <FieldLabel htmlFor="event-entry-fee">
                      Entry Fee <span className="text-muted-foreground text-xs">(Optional)</span>
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id="event-entry-fee"
                      placeholder="e.g. A bottle of your favourite wine."
                      rows={2}
                      aria-invalid={fieldState.invalid}
                      className={`${sharpInputClassName} resize-none`}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
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
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
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
                  className={sharpInputClassName}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="amount_in_kobo"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="amount-in-kobo">
                  Amount (₦){" "}
                  <span className="text-muted-foreground text-xs">(optional; leave empty for a free event)</span>
                </FieldLabel>
                <AmountInput
                  id="amount-in-kobo"
                  placeholder="e.g. 5000"
                  aria-invalid={fieldState.invalid}
                  className={sharpInputClassName}
                  value={String(field.value ?? "")}
                  onChange={(digitsOnly) => field.onChange(digitsOnly)}
                  ref={field.ref}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
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
                    className={sharpInputClassName}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
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
                  <FieldLabel htmlFor="venue-address">
                    Venue Address{" "}
                    <span className="text-muted-foreground text-xs">
                      (optional; preferably an address with a map link)
                    </span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="venue-address"
                    placeholder="e.g. 123 Convention Way, City District..."
                    aria-invalid={fieldState.invalid}
                    className={sharpInputClassName}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
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
                  className={sharpInputClassName}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
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
                  className={sharpInputClassName}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </div>
      </div>

      <div className="flex flex-col-reverse items-center justify-between gap-4 border-border border-t bg-muted/30 px-6 py-5 sm:flex-row md:px-8">
        <Button asChild variant="destructive" className="w-full sm:w-auto">
          <Link href="/dashboard/events">Cancel</Link>
        </Button>

        <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          <Button type="submit" className="w-full px-4 sm:w-auto">
            Next
          </Button>
        </div>
      </div>
    </form>
  );
}
