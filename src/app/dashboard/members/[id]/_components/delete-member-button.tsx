"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useMutation, useQueryClient } from "@tanstack/react-query";
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

import { deleteMember } from "../_lib/api";

type DeleteMemberButtonProps = {
  id: string;
  name?: string;
};

export function DeleteMemberButton({ id, name }: DeleteMemberButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => deleteMember(id),
    onSuccess: () => {
      toast.success("Member deleted");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      void queryClient.invalidateQueries({ queryKey: ["member", id] });
      router.push("/dashboard");
    },
    onError: (err: Error) => {
      toast.error("Could not delete member", { description: err.message });
    },
  });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (mutation.isPending) return;
        setOpen(next);
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="flex-1 lg:flex-none">
          Delete member
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this member?</AlertDialogTitle>
          <AlertDialogDescription>
            {name ? (
              <>
                <span className="font-medium text-foreground">{name}</span> will be soft-deleted and removed from the
                members list. This action cannot be undone from the admin dashboard.
              </>
            ) : (
              <>This member will be soft-deleted and removed from the members list.</>
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
