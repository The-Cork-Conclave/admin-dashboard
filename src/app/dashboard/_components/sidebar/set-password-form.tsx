"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authFetch } from "@/lib/auth/auth-fetch";
import { bffRoutes } from "@/lib/bff-routes";

const formSchema = z.object({
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

async function postAdminPassword(password: string): Promise<void> {
  const res = await authFetch(bffRoutes.adminAuth.password(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  if (!res.ok) {
    let message = "Could not update password. Please try again.";
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

export function SetPasswordForm({ mode, onSuccess }: { mode: "set" | "change"; onSuccess?: () => void }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (input: z.infer<typeof formSchema>) => postAdminPassword(input.password),
    onSuccess: () => {
      toast.success(mode === "set" ? "Password set" : "Password updated");
      form.reset();
      onSuccess?.();
    },
    onError: (err: Error) => {
      toast.error(mode === "set" ? "Could not set password" : "Could not change password", {
        description: err.message,
      });
    },
  });

  return (
    <form noValidate onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="set-password-input">Password</FieldLabel>
              <Input
                {...field}
                id="set-password-input"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
                disabled={mutation.isPending}
                className="rounded-md border-foreground/25"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Button className="w-full" type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving…" : mode === "set" ? "Set password" : "Change password"}
      </Button>
    </form>
  );
}
