"use client";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { bffRoutes } from "@/lib/bff-routes";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().optional(),
});

type SigninResult = { authenticated: true } | { magicLinkSent: true };

const sharpInputClassName = "rounded-md border-foreground/25";

async function postSigninRequestLink(input: { email: string; password?: string }): Promise<SigninResult> {
  const body: { email: string; password?: string } = { email: input.email };
  const password = input.password?.trim();
  if (password) body.password = password;

  const res = await fetch(bffRoutes.adminAuth.requestLink(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error("Invalid Credentials");
  }

  const data = (await res.json()) as {
    authenticated?: boolean;
    magic_link_sent?: boolean;
    ok?: boolean;
  };

  if (data.authenticated === true) {
    return { authenticated: true };
  }

  if (data.magic_link_sent === true || data.ok === true) {
    return { magicLinkSent: true };
  }

  throw new Error("Invalid Credentials");
}

export function LoginForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (input: z.infer<typeof formSchema>) =>
      postSigninRequestLink({
        email: input.email,
        password: input.password,
      }),
    onSuccess: (result) => {
      if ("authenticated" in result) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }
      toast.success("Check your email", {
        description: "You will receive the sign-in link at the provided email address if it exists.",
      });
    },
    onError: (err: Error) => {
      toast.error("Invalid Credentials", {
        description: err.message === "Invalid Credentials" ? undefined : err.message,
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
          name="email"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-email">Email Address</FieldLabel>
              <Input
                {...field}
                className={sharpInputClassName}
                id="login-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={fieldState.invalid}
                disabled={mutation.isPending}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-password">Password (optional)</FieldLabel>
              <Input
                {...field}
                className={sharpInputClassName}
                id="login-password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={fieldState.invalid}
                disabled={mutation.isPending}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Button className="w-full" type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
