"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AmountInput } from "@/components/amount-input";
import { DateTimePicker } from "@/components/date-time-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { createFinanceItem, type PlatformFinanceItemDTO, updateFinanceItem } from "../_lib/api";

type ItemFormModalProps = {
  item?: PlatformFinanceItemDTO | null;
  onSaved?: () => Promise<void> | void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

const sharpInputClassName = "rounded-md border-foreground/25";

const formSchema = z.object({
  title: z.string().trim().min(1, { message: "Please enter a title." }),
  type: z.enum(["expense", "income"], { message: "Please select a type." }),
  amountNaira: z
    .string()
    .min(1, { message: "Please enter an amount." })
    .refine((value) => /^\d+$/.test(value.trim()), { message: "Amount must be a whole number in naira." })
    .refine((value) => Number(value.trim()) > 0, { message: "Amount must be greater than 0." }),
  category: z.string(),
  description: z.string(),
  itemDate: z.string(),
  vendorName: z.string(),
  paidBy: z.string(),
  paymentMethod: z.string(),
});

type FormInput = z.infer<typeof formSchema>;

const INITIAL: FormInput = {
  title: "",
  type: "expense",
  amountNaira: "",
  category: "",
  description: "",
  itemDate: "",
  vendorName: "",
  paidBy: "",
  paymentMethod: "",
};

function toOptional(value: string) {
  const t = value.trim();
  return t.length > 0 ? t : undefined;
}

function toDatetimeLocalString(date: Date): string {
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function buildValues(item?: PlatformFinanceItemDTO | null): FormInput {
  if (!item) return INITIAL;
  const parsed = item.item_date ? new Date(item.item_date) : undefined;
  return {
    title: item.title,
    type: item.type,
    amountNaira: String(Math.trunc(item.amount_in_kobo / 100)),
    category: item.category ?? "",
    description: item.description ?? "",
    itemDate: parsed && !Number.isNaN(parsed.getTime()) ? toDatetimeLocalString(parsed) : "",
    vendorName: item.vendor_name ?? "",
    paidBy: item.paid_by ?? "",
    paymentMethod: item.payment_method ?? "",
  };
}

export function ItemFormModal({ item, onSaved, onOpenChange, open }: ItemFormModalProps) {
  const isEdit = Boolean(item?.id);
  const form = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: INITIAL,
  });

  const initialValues = React.useMemo(() => buildValues(item), [item]);

  React.useEffect(() => {
    if (!open) return;
    form.reset(initialValues);
  }, [form, initialValues, open]);

  const mutation = useMutation({
    mutationFn: async (values: FormInput) => {
      const payload = {
        title: values.title.trim(),
        type: values.type,
        amount_in_kobo: Number(values.amountNaira.trim()) * 100,
        description: toOptional(values.description),
        category: toOptional(values.category),
        item_date: values.itemDate ? new Date(values.itemDate).toISOString() : undefined,
        vendor_name: toOptional(values.vendorName),
        paid_by: toOptional(values.paidBy),
        payment_method: toOptional(values.paymentMethod),
      };
      if (isEdit && item) {
        return updateFinanceItem(item.id, payload);
      }
      return createFinanceItem(payload);
    },
    onSuccess: async () => {
      toast.success(isEdit ? "Finance item updated" : "Finance item created");
      await onSaved?.();
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(isEdit ? "Could not update item" : "Could not create item", { description: err.message });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit finance item" : "Add finance item"}</DialogTitle>
          <DialogDescription>Non-event income or expense (not tied to a specific event).</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <FieldGroup className="gap-4">
            <Controller
              control={form.control}
              name="type"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel>Type</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={mutation.isPending}>
                    <SelectTrigger className={sharpInputClassName}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="title"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel>Title</FieldLabel>
                  <Input {...field} className={sharpInputClassName} disabled={mutation.isPending} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="amountNaira"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel>Amount (₦)</FieldLabel>
                  <AmountInput {...field} className={sharpInputClassName} disabled={mutation.isPending} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="itemDate"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel>Date</FieldLabel>
                  <DateTimePicker value={field.value} onChange={field.onChange} disabled={mutation.isPending} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="category"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel>Category</FieldLabel>
                  <Input {...field} className={sharpInputClassName} disabled={mutation.isPending} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel>Description</FieldLabel>
                  <Textarea {...field} className={sharpInputClassName} disabled={mutation.isPending} rows={3} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="vendorName"
              render={({ field }) => (
                <Field className="gap-1.5">
                  <FieldLabel>Vendor / source</FieldLabel>
                  <Input {...field} className={sharpInputClassName} disabled={mutation.isPending} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="paidBy"
              render={({ field }) => (
                <Field className="gap-1.5">
                  <FieldLabel>Paid by</FieldLabel>
                  <Input {...field} className={sharpInputClassName} disabled={mutation.isPending} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <Field className="gap-1.5">
                  <FieldLabel>Payment method</FieldLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange} disabled={mutation.isPending}>
                    <SelectTrigger className={sharpInputClassName}>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Add item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
