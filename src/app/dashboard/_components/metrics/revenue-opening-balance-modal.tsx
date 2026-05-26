"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AmountInput } from "@/components/amount-input";
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

import { updatePlatformRevenueAdjustment } from "./api";

type RevenueOpeningBalanceModalProps = {
  initialPreviousRevenueInKobo?: number;
  onSaved?: () => Promise<void> | void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

const sharpInputClassName = "rounded-md border-foreground/25";

const formSchema = z.object({
  amountNaira: z
    .string()
    .min(1, { message: "Please enter an amount." })
    .refine((value) => /^\d+$/.test(value.trim()), { message: "Amount must be a whole number in naira." })
    .refine((value) => Number(value.trim()) >= 0, { message: "Amount must be 0 or greater." }),
});

type FormInput = z.infer<typeof formSchema>;

function koboToNairaDigits(kobo: number | undefined): string {
  if (!kobo) return "";
  return String(Math.floor(kobo / 100));
}

function nairaDigitsToKobo(nairaDigits: string): number {
  const n = Number(nairaDigits.trim());
  return Number.isFinite(n) ? n * 100 : 0;
}

export function RevenueOpeningBalanceModal({
  initialPreviousRevenueInKobo,
  onSaved,
  onOpenChange,
  open,
}: RevenueOpeningBalanceModalProps) {
  const form = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: { amountNaira: koboToNairaDigits(initialPreviousRevenueInKobo) },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset({ amountNaira: koboToNairaDigits(initialPreviousRevenueInKobo) });
  }, [form, initialPreviousRevenueInKobo, open]);

  const mutation = useMutation({
    mutationFn: async (input: FormInput) =>
      updatePlatformRevenueAdjustment({
        previous_revenue_in_kobo: nairaDigitsToKobo(input.amountNaira),
      }),
    onSuccess: async () => {
      await onSaved?.();
      toast.success("Opening revenue updated");
      onOpenChange(false);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Could not update opening revenue.";
      toast.error("Could not update opening revenue", { description: message });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Opening revenue</DialogTitle>
          <DialogDescription>
            Use this to account for revenue collected outside the platform. It affects the dashboard headline total
            only.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit((data) => mutation.mutate(data))} noValidate>
          <Controller
            control={form.control}
            name="amountNaira"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-1.5">
                <FieldLabel htmlFor="platform-opening-revenue">Amount (₦)</FieldLabel>
                <AmountInput
                  id="platform-opening-revenue"
                  value={field.value}
                  onChange={field.onChange}
                  className={sharpInputClassName}
                  disabled={mutation.isPending}
                  placeholder="0"
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />

          <DialogFooter>
            <FieldGroup className="w-full">
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save"}
              </Button>
            </FieldGroup>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
