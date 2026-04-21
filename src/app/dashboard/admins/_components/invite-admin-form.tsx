"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { apiRoutes } from "@/lib/routes";

const formSchema = z.object({
  name: z.string().min(1, { message: "Please enter a name." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
});


async function postAdminInvite(input: z.infer<typeof formSchema>): Promise<void> {
  const res = await fetch(apiRoutes.admins.invite(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name: input.name, email: input.email }),
  });

  if (!res.ok) {
    let message = "Could not send invite. Please try again.";
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

export function InviteAdminForm({ onSuccess }: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (input: z.infer<typeof formSchema>) => postAdminInvite(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success("Invite sent", {
        description: "If an account doesn't already exist, we sent an invite email.",
      });
      onSuccess?.();
    },
    onError: (err: Error) => {
      toast.error("Could not send invite", {
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
              <FieldLabel htmlFor="invite-admin-name">Name</FieldLabel>
              <Input
                {...field}
                id="invite-admin-name"
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
              <FieldLabel htmlFor="invite-admin-email">Email Address</FieldLabel>
              <Input
                {...field}
                id="invite-admin-email"
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
      </FieldGroup>

      <Button className="w-full" type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Sending…" : "Send invite"}
      </Button>
    </form>
  );
}
