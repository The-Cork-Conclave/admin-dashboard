"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth/auth-fetch";

async function deleteEventClient(id: string): Promise<void> {
  const res = await authFetch(`/api/events/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    let message = "Could not delete event. Please try again.";
    try {
      const body = (await res.json()) as { message?: string };
      if (typeof body.message === "string" && body.message.length > 0) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
}

type DeleteEventButtonProps = {
  id: string;
  name?: string;
  status?: string;
};

export function DeleteEventButton({ id, name, status }: DeleteEventButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => deleteEventClient(id),
    onSuccess: () => {
      toast.success("Event deleted");
      setOpen(false);
      router.push("/dashboard/events");
      void queryClient.invalidateQueries({ queryKey: ["events"] });
      void queryClient.invalidateQueries({ queryKey: ["event", id] });
    },
    onError: (err: Error) => {
      toast.error("Could not delete event", { description: err.message });
      setOpen(false);
    },
  });

  if (status === "active") return null;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (mutation.isPending) return;
        setOpen(next);
      }}
    >
      <AlertDialogTrigger asChild>
        <Button size="sm" className="bg-red-700 text-white hover:bg-red-800">
          Delete Event <Trash />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this event?</AlertDialogTitle>
          <AlertDialogDescription>
            {name ? (
              <>
                <span className="font-medium text-foreground">{name}</span> will be permanently
                deleted. Active tickets and registrations will be cancelled, and any pending
                reminder emails will be cancelled. This action cannot be undone.
              </>
            ) : (
              <>
                This event will be permanently deleted. Active tickets and registrations will be
                cancelled, and any pending reminder emails will be cancelled. This action cannot be
                undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={mutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            {mutation.isPending ? "Deleting…" : "Yes, delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
