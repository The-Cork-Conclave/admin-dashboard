"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AmountInput } from "@/components/amount-input";
import { ImageUpload } from "@/components/image-upload";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { createMerchProduct, updateMerchProduct } from "../_lib/api";
import type { MerchProduct } from "../_lib/types";

type ProductFormModalProps = {
  product?: MerchProduct | null;
  onSaved?: () => Promise<void> | void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

const colorSchema = z.object({
  label: z.string().trim().min(1, { message: "Color label is required." }),
  value: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, { message: "Pick a hex color." }),
});

const formSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required." }),
  description: z.string(),
  image_url: z.string().trim().min(1, { message: "Upload a product image." }),
  priceNaira: z
    .string()
    .min(1, { message: "Price is required." })
    .refine((v) => /^\d+$/.test(v.trim()), { message: "Price must be a whole number in naira." }),
  deliveryFeeNaira: z
    .string()
    .min(1, { message: "Delivery fee is required." })
    .refine((v) => /^\d+$/.test(v.trim()), { message: "Delivery fee must be a whole number." }),
  pickup_location: z.string(),
  colors: z.array(colorSchema).min(1, { message: "Add at least one color." }),
  sizesText: z.string().trim().min(1, { message: "Add at least one size (comma-separated)." }),
  is_active: z.boolean(),
});

type FormInput = z.infer<typeof formSchema>;

const INITIAL: FormInput = {
  name: "",
  description: "",
  image_url: "",
  priceNaira: "",
  deliveryFeeNaira: "4000",
  pickup_location: "",
  colors: [{ label: "", value: "#000000" }],
  sizesText: "S, M, L, XL",
  is_active: true,
};

function buildValues(product?: MerchProduct | null): FormInput {
  if (!product) return INITIAL;
  return {
    name: product.name,
    description: product.description,
    image_url: product.image_url,
    priceNaira: String(Math.trunc(product.price_in_kobo / 100)),
    deliveryFeeNaira: String(Math.trunc(product.delivery_fee_in_kobo / 100)),
    pickup_location: product.pickup_location,
    colors: product.colors.length
      ? product.colors.map((c) => ({ label: c.label, value: c.value }))
      : [{ label: "", value: "#000000" }],
    sizesText: product.sizes.join(", "),
    is_active: product.is_active,
  };
}

export function ProductFormModal({ product, onSaved, onOpenChange, open }: ProductFormModalProps) {
  const isEdit = Boolean(product?.id);
  const form = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: INITIAL,
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "colors" });

  const initialValues = React.useMemo(() => buildValues(product), [product]);

  React.useEffect(() => {
    if (!open) return;
    form.reset(initialValues);
  }, [form, initialValues, open]);

  const mutation = useMutation({
    mutationFn: async (values: FormInput) => {
      const sizes = values.sizesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const body = {
        name: values.name.trim(),
        description: values.description.trim(),
        image_url: values.image_url.trim(),
        price_in_kobo: Number(values.priceNaira.trim()) * 100,
        delivery_fee_in_kobo: Number(values.deliveryFeeNaira.trim()) * 100,
        pickup_location: values.pickup_location.trim(),
        colors: values.colors.map((c) => ({
          label: c.label.trim(),
          value: c.value.trim().toUpperCase(),
        })),
        sizes,
        is_active: values.is_active,
      };
      if (isEdit && product) {
        return updateMerchProduct(product.id, body);
      }
      return createMerchProduct(body);
    },
    onSuccess: async () => {
      toast.success(isEdit ? "Product updated" : "Product created");
      onOpenChange(false);
      await onSaved?.();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save product");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit product" : "New product"}</DialogTitle>
          <DialogDescription>
            Configure shirt price, colors (label + hex), sizes, delivery fee, and pickup location.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <FieldGroup>
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input {...form.register("name")} placeholder="Anniversary tee" />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>

            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea {...form.register("description")} rows={3} />
            </Field>

            <Field>
              <FieldLabel>Image</FieldLabel>
              <Controller
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <ImageUpload folder="cork-conclave/merch" value={field.value} onChange={field.onChange} />
                )}
              />
              <FieldError errors={[form.formState.errors.image_url]} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Price (₦)</FieldLabel>
                <Controller
                  control={form.control}
                  name="priceNaira"
                  render={({ field }) => <AmountInput value={field.value} onChange={field.onChange} />}
                />
                <FieldError errors={[form.formState.errors.priceNaira]} />
              </Field>
              <Field>
                <FieldLabel>Delivery fee (₦)</FieldLabel>
                <Controller
                  control={form.control}
                  name="deliveryFeeNaira"
                  render={({ field }) => <AmountInput value={field.value} onChange={field.onChange} />}
                />
                <FieldError errors={[form.formState.errors.deliveryFeeNaira]} />
              </Field>
            </div>

            <Field>
              <FieldLabel>Pickup location</FieldLabel>
              <Textarea {...form.register("pickup_location")} rows={2} placeholder="Venue / address for pickup" />
            </Field>

            <Field>
              <FieldLabel>Sizes (comma-separated)</FieldLabel>
              <Input {...form.register("sizesText")} placeholder="S, M, L, XL" />
              <FieldError errors={[form.formState.errors.sizesText]} />
            </Field>

            <Field>
              <div className="mb-2 flex items-center justify-between">
                <FieldLabel>Colors</FieldLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ label: "", value: "#000000" })}
                >
                  <Plus className="size-4" />
                  Add color
                </Button>
              </div>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <Input {...form.register(`colors.${index}.label`)} placeholder="Purple" className="flex-1" />
                    <Input
                      type="color"
                      {...form.register(`colors.${index}.value`)}
                      className="h-9 w-14 cursor-pointer p-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={fields.length < 2}
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <FieldError errors={[form.formState.errors.colors]} />
            </Field>

            <Field>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <FieldLabel>Active (accepting sales)</FieldLabel>
                  <p className="text-muted-foreground text-xs">Turn off to pause sales.</p>
                </div>
                <Controller
                  control={form.control}
                  name="is_active"
                  render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                />
              </div>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
