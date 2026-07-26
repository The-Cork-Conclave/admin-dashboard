"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import PhoneInput, { isValidPhoneNumber, type Value as PhoneValue } from "react-phone-number-input";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authFetch } from "@/lib/auth/auth-fetch";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(1, { message: "Please enter a name." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone_number: z
    .string()
    .min(1, { message: "Please enter a phone number." })
    .refine((value) => isValidPhoneNumber(value), {
      message: "Please enter a valid phone number.",
    }),
});

async function postCreateMember(input: z.infer<typeof formSchema>): Promise<void> {
  const res = await authFetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      phone_number: input.phone_number,
    }),
  });

  if (!res.ok) {
    let message = "Could not add member. Please try again.";
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

export function AddMemberForm({ onSuccess }: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone_number: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (input: z.infer<typeof formSchema>) => postCreateMember(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Member added");
      onSuccess?.();
    },
    onError: (err: Error) => {
      toast.error("Could not add member", {
        description: err.message,
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    mutation.mutate(data);
  };

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="add-member-name">Name</FieldLabel>
              <Input
                {...field}
                id="add-member-name"
                placeholder="Full name"
                autoComplete="name"
                aria-invalid={fieldState.invalid}
                disabled={mutation.isPending}
                className="rounded-md border-foreground/25"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="add-member-email">Email Address</FieldLabel>
              <Input
                {...field}
                id="add-member-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={fieldState.invalid}
                disabled={mutation.isPending}
                className="rounded-md border-foreground/25"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="phone_number"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="add-member-phone">Phone Number</FieldLabel>
              <div
                className={cn(
                  "flex h-8 w-full min-w-0 items-center rounded-md border border-foreground/25 border-input bg-background px-2.5 py-1 text-base transition-colors md:text-sm dark:bg-input/30",
                  "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
                  fieldState.invalid &&
                    "border-destructive focus-within:border-destructive focus-within:ring-destructive/20 dark:border-destructive/50 dark:focus-within:ring-destructive/40",
                  mutation.isPending &&
                    "pointer-events-none cursor-not-allowed bg-input/50 opacity-50 dark:bg-input/80",
                )}
                aria-invalid={fieldState.invalid}
              >
                <PhoneInput
                  className="PhoneInput w-full gap-2 [--PhoneInputCountryFlag-height:1em] [--PhoneInputCountrySelectArrow-color:var(--muted-foreground)] [--PhoneInputCountrySelectArrow-opacity:1]"
                  international
                  defaultCountry="NG"
                  placeholder="Enter phone number"
                  value={(field.value || undefined) as PhoneValue | undefined}
                  onChange={(value) => field.onChange(value ?? "")}
                  onBlur={field.onBlur}
                  disabled={mutation.isPending}
                  autoComplete="tel"
                  numberInputProps={{
                    id: "add-member-phone",
                    required: true,
                    "aria-invalid": fieldState.invalid,
                    className:
                      "PhoneInputInput w-full min-w-0 bg-transparent p-0 text-sm text-foreground outline-none border-0 shadow-none focus:ring-0 focus:outline-none placeholder:text-muted-foreground placeholder:opacity-100",
                  }}
                />
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Button className="w-full" type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Adding…" : "Add member"}
      </Button>
    </form>
  );
}
