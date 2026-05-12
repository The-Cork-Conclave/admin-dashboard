"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AmountInput } from "@/components/amount-input";
import { DateTimePicker } from "@/components/date-time-picker";
import { FileUpload } from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { createEventExpense, type EventExpenseDTO, updateEventExpense } from "../api";
import type { ExpenseRow } from "./expenses-table-schema";

type AddExpenseModalProps = {
  eventId: string;
  expense?: ExpenseRow | null;
  onExpenseSaved?: (expense: EventExpenseDTO) => Promise<void> | void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

const sharpInputClassName = "rounded-md border-foreground/25";
const paymentMethodValues = ["cash", "transfer", "card", "other"] as const;

const formSchema = z.object({
  title: z.string().trim().min(1, { message: "Please enter a title." }),
  amountNaira: z
    .string()
    .min(1, { message: "Please enter an amount." })
    .refine((value) => /^\d+$/.test(value.trim()), {
      message: "Amount must be a whole number in naira.",
    })
    .refine((value) => Number(value.trim()) > 0, {
      message: "Amount must be greater than 0.",
    }),
  category: z.string().trim().min(1, { message: "Please enter a category." }),
  description: z.string().trim().min(1, { message: "Please enter a description." }),
  expenseDate: z.string().min(1, { message: "Please select an expense date." }),
  vendorName: z.string(),
  paidBy: z.string(),
  paymentMethod: z
    .string()
    .min(1, { message: "Please select a payment method." })
    .refine((value) => paymentMethodValues.includes(value as (typeof paymentMethodValues)[number]), {
      message: "Please select a valid payment method.",
    }),
  receiptUrl: z
    .string()
    .trim()
    .refine((value) => value.length === 0 || z.string().url().safeParse(value).success, {
      message: "Please enter a valid receipt URL.",
    }),
});

type FormInput = z.infer<typeof formSchema>;

const INITIAL_FORM_VALUES: FormInput = {
  title: "",
  amountNaira: "",
  category: "",
  description: "",
  expenseDate: "",
  vendorName: "",
  paidBy: "",
  paymentMethod: "",
  receiptUrl: "",
};

function toOptionalTrimmedString(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toDatetimeLocalString(date: Date): string {
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return [
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`,
    `${pad2(date.getHours())}:${pad2(date.getMinutes())}`,
  ].join("T");
}

function toRFC3339FromDatetimeLocal(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function buildFormValues(expense?: ExpenseRow | null): FormInput {
  if (!expense) return INITIAL_FORM_VALUES;

  const parsedExpenseDate = expense.expense_date ? new Date(expense.expense_date) : undefined;

  return {
    title: expense.title ?? "",
    amountNaira: typeof expense.amount_in_kobo === "number" ? String(Math.trunc(expense.amount_in_kobo / 100)) : "",
    category: expense.category ?? "",
    description: expense.description ?? "",
    expenseDate:
      parsedExpenseDate && !Number.isNaN(parsedExpenseDate.getTime()) ? toDatetimeLocalString(parsedExpenseDate) : "",
    vendorName: expense.vendor_name ?? "",
    paidBy: expense.paid_by ?? "",
    paymentMethod: expense.payment_method ?? "",
    receiptUrl: expense.receipt_url ?? "",
  };
}

export function AddExpenseModal({ eventId, expense, onExpenseSaved, onOpenChange, open }: AddExpenseModalProps) {
  const [isReceiptUploading, setIsReceiptUploading] = React.useState(false);
  const isEditMode = Boolean(expense?.id);

  const form = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: INITIAL_FORM_VALUES,
  });

  const initialValues = React.useMemo(() => buildFormValues(expense), [expense]);
  const receiptUrl = useWatch({
    control: form.control,
    name: "receiptUrl",
  });

  const resetForm = React.useCallback(() => {
    form.reset(initialValues);
    setIsReceiptUploading(false);
  }, [form, initialValues]);

  React.useEffect(() => {
    if (!open) return;
    form.reset(initialValues);
  }, [form, initialValues, open]);

  const saveMutation = useMutation({
    mutationFn: async (values: FormInput) => {
      const payload = {
        title: values.title.trim(),
        amount_in_kobo: Number(values.amountNaira.trim()) * 100,
        currency: "NGN",
        category: values.category.trim(),
        description: values.description.trim(),
        expense_date: toRFC3339FromDatetimeLocal(values.expenseDate),
        vendor_name: toOptionalTrimmedString(values.vendorName),
        receipt_url: toOptionalTrimmedString(values.receiptUrl),
        paid_by: toOptionalTrimmedString(values.paidBy),
        payment_method: values.paymentMethod,
      };

      if (isEditMode && expense?.id) {
        return updateEventExpense(eventId, expense.id, payload);
      }

      return createEventExpense(eventId, payload);
    },
    onSuccess: async (result) => {
      await onExpenseSaved?.(result.expense);
      resetForm();
      onOpenChange(false);
      toast.success(isEditMode ? "Expense updated" : "Expense added", {
        description: isEditMode ? "The expense changes have been saved." : "The expense has been saved successfully.",
      });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : `Could not ${isEditMode ? "update" : "create"} expense.`;
      form.setError("root.serverError", { message });
      toast.error(`Could not ${isEditMode ? "update" : "create"} expense`, { description: message });
    },
  });

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && (saveMutation.isPending || isReceiptUploading)) {
        return;
      }

      if (!nextOpen) {
        resetForm();
      }

      onOpenChange(nextOpen);
    },
    [isReceiptUploading, onOpenChange, resetForm, saveMutation.isPending],
  );

  const isSubmitDisabled = saveMutation.isPending || isReceiptUploading;

  const onSubmit = (values: FormInput) => {
    form.clearErrors("root");
    saveMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col overflow-hidden p-0 sm:max-w-xl lg:max-w-2xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>{isEditMode ? "Edit Expense" : "Add Expense"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the selected expense details for this event."
              : "Add an expense for this event. Receipt upload is optional."}
          </DialogDescription>
        </DialogHeader>

        <form noValidate className="flex min-h-0 flex-1 flex-col" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <FieldGroup className="space-y-2 px-6 py-0 md:p-8">
              <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Controller
                    control={form.control}
                    name="title"
                    render={({ field, fieldState }) => (
                      <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="expense-title">
                          Title <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          {...field}
                          id="expense-title"
                          placeholder="e.g. Venue booking"
                          aria-invalid={fieldState.invalid}
                          disabled={isSubmitDisabled}
                          className={sharpInputClassName}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  control={form.control}
                  name="amountNaira"
                  render={({ field, fieldState }) => (
                    <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="expense-amount">
                        Amount (₦) <span className="text-destructive">*</span>
                      </FieldLabel>
                      <AmountInput
                        id="expense-amount"
                        placeholder="e.g. 5000"
                        aria-invalid={fieldState.invalid}
                        disabled={isSubmitDisabled}
                        className={sharpInputClassName}
                        value={String(field.value ?? "")}
                        onChange={(digitsOnly) => field.onChange(digitsOnly)}
                        ref={field.ref}
                      />

                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="category"
                  render={({ field, fieldState }) => (
                    <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="expense-category">
                        Category <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        {...field}
                        id="expense-category"
                        placeholder="e.g. Venue"
                        aria-invalid={fieldState.invalid}
                        disabled={isSubmitDisabled}
                        className={sharpInputClassName}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <div className="md:col-span-2">
                  <Controller
                    control={form.control}
                    name="description"
                    render={({ field, fieldState }) => (
                      <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="expense-description">
                          Description <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Textarea
                          {...field}
                          id="expense-description"
                          rows={4}
                          placeholder="Add more details about this expense"
                          aria-invalid={fieldState.invalid}
                          disabled={isSubmitDisabled}
                          className={`${sharpInputClassName} resize-none`}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  control={form.control}
                  name="expenseDate"
                  render={({ field, fieldState }) => (
                    <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="expense-date">
                        Expense Date <span className="text-destructive">*</span>
                      </FieldLabel>
                      <DateTimePicker
                        id="expense-date"
                        value={field.value}
                        onChange={field.onChange}
                        aria-invalid={fieldState.invalid}
                        disabled={isSubmitDisabled}
                        className={sharpInputClassName}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="paymentMethod"
                  render={({ field, fieldState }) => (
                    <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="expense-payment-method">
                        Payment Method <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Select
                        disabled={isSubmitDisabled}
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="expense-payment-method"
                          aria-invalid={fieldState.invalid}
                          className={sharpInputClassName}
                        >
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="transfer">Transfer</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="vendorName"
                  render={({ field, fieldState }) => (
                    <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="expense-vendor">Vendor Name</FieldLabel>
                      <Input
                        {...field}
                        id="expense-vendor"
                        placeholder="e.g. Palms Mall"
                        aria-invalid={fieldState.invalid}
                        disabled={isSubmitDisabled}
                        className={sharpInputClassName}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="paidBy"
                  render={({ field, fieldState }) => (
                    <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="expense-paid-by">Paid By</FieldLabel>
                      <Input
                        {...field}
                        id="expense-paid-by"
                        placeholder="e.g. Adetunji"
                        aria-invalid={fieldState.invalid}
                        disabled={isSubmitDisabled}
                        className={sharpInputClassName}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <div className="md:col-span-2">
                  <Field className="gap-1.5">
                    <FieldLabel>Receipt Upload</FieldLabel>
                    <FileUpload
                      className="w-full"
                      disabled={isSubmitDisabled}
                      folder={`cork-conclave/events/${eventId}/expenses/receipts`}
                      value={receiptUrl}
                      onChange={(url) => form.setValue("receiptUrl", url, { shouldDirty: true, shouldValidate: true })}
                      onUploadingChange={setIsReceiptUploading}
                    />
                    <FieldDescription>Upload an image, PDF, DOC, or DOCX receipt.</FieldDescription>
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Controller
                    control={form.control}
                    name="receiptUrl"
                    render={({ field, fieldState }) => (
                      <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="expense-receipt-url">Receipt URL (Optional)</FieldLabel>
                        <Input
                          {...field}
                          id="expense-receipt-url"
                          placeholder="https://..."
                          type="url"
                          aria-invalid={fieldState.invalid}
                          disabled={isSubmitDisabled}
                          className={sharpInputClassName}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>
              </div>
            </FieldGroup>
          </div>

          <div className="shrink-0 border-t bg-muted/30 px-6 py-2 pb-6">
            {form.formState.errors.root?.serverError ? (
              <FieldError className="mb-4">{form.formState.errors.root.serverError.message}</FieldError>
            ) : null}

            <DialogFooter className="-mx-6 -mb-5 border-t-0 bg-transparent">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitDisabled}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitDisabled}>
                {saveMutation.isPending
                  ? isEditMode
                    ? "Saving changes…"
                    : "Saving…"
                  : isReceiptUploading
                    ? "Uploading receipt…"
                    : isEditMode
                      ? "Save Changes"
                      : "Save Expense"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
