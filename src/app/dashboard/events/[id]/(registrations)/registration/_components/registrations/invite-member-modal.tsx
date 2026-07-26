"use client";

import * as React from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, X } from "lucide-react";
import PhoneInput, { isValidPhoneNumber, type Value as PhoneValue } from "react-phone-number-input";
import { toast } from "sonner";

import { fetchUsersList, type UserListItem } from "@/app/dashboard/_components/members/fetch-members-list";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import useDebouncedValue from "@/hooks/use-debounced-value";
import { authFetch } from "@/lib/auth/auth-fetch";
import { cn } from "@/lib/utils";

type NewMemberDraft = {
  key: string;
  name: string;
  email: string;
  phone_number: string;
};

type InviteMemberModalProps = {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

async function inviteMembers(
  eventId: string,
  members: Array<{ user_id?: string; name?: string; email?: string; phone_number?: string }>,
) {
  const res = await authFetch(`/api/events/${encodeURIComponent(eventId)}/registrations/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ members }),
  });

  if (!res.ok) {
    let message = "Could not send invites.";
    try {
      const body = (await res.json()) as { message?: string };
      if (typeof body.message === "string" && body.message.length > 0) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  return (await res.json()) as {
    results: Array<{ ok: boolean; email?: string; error?: string }>;
  };
}

export function InviteMemberModal({ eventId, open, onOpenChange }: InviteMemberModalProps) {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = React.useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [selected, setSelected] = React.useState<Record<string, UserListItem>>({});
  const [newMembers, setNewMembers] = React.useState<NewMemberDraft[]>([]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSearchInput("");
      setSelected({});
      setNewMembers([]);
    }
    onOpenChange(next);
  };

  const usersQuery = useQuery({
    queryKey: ["invite-members-picker", debouncedSearch],
    queryFn: () =>
      fetchUsersList({
        page: 1,
        perPage: 20,
        q: debouncedSearch.trim() || undefined,
        sortBy: "name",
        sortOrder: "asc",
      }),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: () => {
      const members: Array<{ user_id?: string; name?: string; email?: string; phone_number?: string }> = [];

      for (const user of Object.values(selected)) {
        members.push({ user_id: user.id });
      }

      for (const draft of newMembers) {
        const name = draft.name.trim();
        const email = draft.email.trim();
        const phone = draft.phone_number.trim();
        if (!name || !email || !phone) {
          throw new Error("Fill in name, email, and phone for each new member.");
        }
        if (!isValidPhoneNumber(phone)) {
          throw new Error(`Invalid phone number for ${name || "new member"}.`);
        }
        members.push({ name, email, phone_number: phone });
      }

      if (members.length === 0) {
        throw new Error("Select or add at least one member to invite.");
      }

      return inviteMembers(eventId, members);
    },
    onSuccess: async (data) => {
      const okCount = data.results.filter((r) => r.ok).length;
      const failCount = data.results.length - okCount;
      if (okCount > 0) {
        toast.success(`Invited ${okCount} member${okCount === 1 ? "" : "s"}`);
      }
      if (failCount > 0) {
        const firstError = data.results.find((r) => !r.ok)?.error;
        toast.error(`Could not invite ${failCount} member${failCount === 1 ? "" : "s"}`, {
          description: firstError,
        });
      }
      await queryClient.invalidateQueries({ queryKey: [`events-${eventId}-registrations`] });
      handleOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error("Could not send invites", { description: err.message });
    },
  });

  const toggleUser = (user: UserListItem) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[user.id]) delete next[user.id];
      else next[user.id] = user;
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Invite members</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search members..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Existing members</div>
            {usersQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
                {(usersQuery.data?.data ?? []).length === 0 ? (
                  <p className="p-2 text-muted-foreground text-sm">No members found.</p>
                ) : (
                  (usersQuery.data?.data ?? []).map((user) => {
                    const checked = Boolean(selected[user.id]);
                    return (
                      <button
                        type="button"
                        key={user.id}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-muted/50"
                        onClick={() => toggleUser(user)}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleUser(user)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-sm">{user.name}</span>
                          <span className="block truncate text-muted-foreground text-xs">{user.email}</span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
            {Object.keys(selected).length > 0 ? (
              <p className="text-muted-foreground text-xs">{Object.keys(selected).length} selected</p>
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Add new members</div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setNewMembers((prev) => [
                    ...prev,
                    { key: crypto.randomUUID(), name: "", email: "", phone_number: "" },
                  ])
                }
              >
                <Plus className="size-4" />
                Add
              </Button>
            </div>

            {newMembers.map((draft, index) => (
              <div key={draft.key} className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">New member {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setNewMembers((prev) => prev.filter((m) => m.key !== draft.key))}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                <FieldGroup className="gap-2">
                  <Field className="gap-1">
                    <FieldLabel>Name</FieldLabel>
                    <Input
                      value={draft.name}
                      onChange={(e) =>
                        setNewMembers((prev) =>
                          prev.map((m) => (m.key === draft.key ? { ...m, name: e.target.value } : m)),
                        )
                      }
                      placeholder="Full name"
                    />
                  </Field>
                  <Field className="gap-1">
                    <FieldLabel>Email</FieldLabel>
                    <Input
                      type="email"
                      value={draft.email}
                      onChange={(e) =>
                        setNewMembers((prev) =>
                          prev.map((m) => (m.key === draft.key ? { ...m, email: e.target.value } : m)),
                        )
                      }
                      placeholder="you@example.com"
                    />
                  </Field>
                  <Field className="gap-1">
                    <FieldLabel>Phone</FieldLabel>
                    <div
                      className={cn(
                        "flex h-8 w-full min-w-0 items-center rounded-md border border-input bg-background px-2.5 py-1 text-sm",
                      )}
                    >
                      <PhoneInput
                        className="PhoneInput w-full gap-2"
                        international
                        defaultCountry="NG"
                        value={(draft.phone_number || undefined) as PhoneValue | undefined}
                        onChange={(value) =>
                          setNewMembers((prev) =>
                            prev.map((m) => (m.key === draft.key ? { ...m, phone_number: value ?? "" } : m)),
                          )
                        }
                      />
                    </div>
                    {draft.phone_number && !isValidPhoneNumber(draft.phone_number) ? (
                      <FieldError errors={[{ message: "Enter a valid phone number." }]} />
                    ) : null}
                  </Field>
                </FieldGroup>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t px-6 py-4">
          <Button className="w-full" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Sending…" : "Send invites"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
