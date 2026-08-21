"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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

import { requeryPayment } from "../_lib/api";

type RequeryPaymentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const formSchema = z
  .object({
    transaction_reference: z.string(),
    payment_reference: z.string(),
  })
  .superRefine((value, ctx) => {
    const txn = value.transaction_reference.trim();
    const pay = value.payment_reference.trim();
    if (!txn && !pay) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a transaction reference and/or payment reference.",
        path: ["transaction_reference"],
      });
    }
  });

type FormInput = z.infer<typeof formSchema>;

export function RequeryPaymentModal({ open, onOpenChange }: RequeryPaymentModalProps) {
  const form = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: { transaction_reference: "", payment_reference: "" },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset({ transaction_reference: "", payment_reference: "" });
  }, [form, open]);

  const mutation = useMutation({
    mutationFn: async (input: FormInput) => {
      const txn = input.transaction_reference.trim();
      const pay = input.payment_reference.trim();
      return requeryPayment({
        transaction_reference: txn || undefined,
        payment_reference: pay || undefined,
      });
    },
    onSuccess: (data) => {
      toast.success(data.message, {
        description: `Status: ${data.status} · ${data.transaction_reference}`,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Could not requery payment.";
      toast.error("Payment requery failed", { description: message });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Requery payment</DialogTitle>
          <DialogDescription>
            Verify an Ercas payment that may have succeeded without completing fulfillment. Prefer the transaction
            reference when you have both.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit((data) => mutation.mutate(data))} noValidate>
          <FieldGroup>
            <Controller
              control={form.control}
              name="transaction_reference"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="requery-txn-ref">Transaction reference</FieldLabel>
                  <Input
                    {...field}
                    id="requery-txn-ref"
                    placeholder="ER|…"
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="payment_reference"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="requery-pay-ref">Payment reference</FieldLabel>
                  <Input
                    {...field}
                    id="requery-pay-ref"
                    placeholder="ER_…"
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Verifying…" : "Verify payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
