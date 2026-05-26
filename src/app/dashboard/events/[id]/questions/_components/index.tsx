"use client";

import * as React from "react";

import Link from "next/link";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, GripVertical, Pencil, Plus, Trash, Type } from "lucide-react";
import { toast } from "sonner";

import { CreateQuestionDrawer } from "@/app/dashboard/events/_components/questions/create-question-drawer";
import {
  type DraftQuestion,
  newDraftQuestion,
  questionTypeLabel,
  reindexQuestions,
} from "@/app/dashboard/events/_components/questions/draft";
import { SortableVerticalList } from "@/app/dashboard/events/_components/questions/sortable-vertical-list";
import {
  createEventQuestion,
  deleteEventQuestion,
  fetchEventQuestions,
  reorderEventQuestions,
  updateEventQuestion,
} from "@/app/dashboard/events/[id]/questions/_lib/questions-api.client";
import {
  apiQuestionToDraft,
  draftToCreatePayload,
  draftToUpdatePayload,
  syncQuestionOptions,
} from "@/app/dashboard/events/[id]/questions/_lib/questions-mapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuestionsPage({ id }: { id: string }) {
  const queryClient = useQueryClient();

  const questionsQuery = useQuery({
    queryKey: ["eventQuestions", id],
    queryFn: () => fetchEventQuestions(id),
    enabled: Boolean(id?.trim()),
  });

  const drafts: DraftQuestion[] = (questionsQuery.data ?? []).map(apiQuestionToDraft);
  const sortedDrafts = [...drafts].sort((a, b) => a.sort_order - b.sort_order);
  const sortableItems = sortedDrafts.map((q) => ({ ...q, id: q.clientId }));

  const createMutation = useMutation({
    mutationFn: (draft: DraftQuestion) => createEventQuestion(id, draftToCreatePayload(draft)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["eventQuestions", id] });
      toast.success("Question created");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Could not create question.";
      toast.error("Could not create question", { description: msg });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (draft: DraftQuestion) => {
      const before = questionsQuery.data?.find((q) => q.id === draft.clientId);
      const updated = await updateEventQuestion(id, draft.clientId, draftToUpdatePayload(draft));

      if ((draft.type === "single_choice" || draft.type === "multiple_choice") && before) {
        await syncQuestionOptions({
          eventId: id,
          questionId: draft.clientId,
          before: before.options ?? [],
          after: draft.options ?? [],
        });
      }

      return updated;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["eventQuestions", id] });
      toast.success("Question updated");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Could not update question.";
      toast.error("Could not update question", { description: msg });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (questionId: string) => deleteEventQuestion(id, questionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["eventQuestions", id] });
      toast.success("Question deleted");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Could not delete question.";
      toast.error("Could not delete question", { description: msg });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (items: DraftQuestion[]) =>
      reorderEventQuestions(id, {
        items: items.map((q) => ({ id: q.clientId, sort_order: q.sort_order })),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["eventQuestions", id] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Could not reorder questions.";
      toast.error("Could not reorder questions", { description: msg });
    },
  });

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [drawerMode, setDrawerMode] = React.useState<"create" | "edit">("create");
  const [editingQuestion, setEditingQuestion] = React.useState<DraftQuestion | undefined>();

  const openCreate = () => {
    setDrawerMode("create");
    setEditingQuestion(undefined);
    setDrawerOpen(true);
  };

  const openEdit = (question: DraftQuestion) => {
    setDrawerMode("edit");
    setEditingQuestion(question);
    setDrawerOpen(true);
  };

  const isBusy =
    questionsQuery.isLoading ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    reorderMutation.isPending;

  const handleSave = (draft: DraftQuestion) => {
    if (drawerMode === "edit") {
      updateMutation.mutate(draft);
      return;
    }
    createMutation.mutate(draft);
  };

  const handleDelete = (questionId: string) => {
    const ok = window.confirm("Delete this question? This cannot be undone.");
    if (!ok) return;
    deleteMutation.mutate(questionId);
  };

  const handleReorder = (items: Array<DraftQuestion & { id: string }>) => {
    const reordered = items.map((item, index) => {
      const { id: _id, ...rest } = item;
      return { ...rest, sort_order: index };
    });
    reorderMutation.mutate(reindexQuestions(reordered));
  };

  return (
    <main className="mx-auto w-full max-w-5xl p-6 md:p-10 lg:p-12">
      <header className="mb-8 space-y-3">
        <Button asChild variant="ghost" className="-ml-2 w-fit px-2">
          <Link href={`/dashboard/events/${encodeURIComponent(id)}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to event
          </Link>
        </Button>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Registration questions</h1>
            <p className="text-muted-foreground text-sm">
              Create, edit, reorder, and delete attendee registration questions.
            </p>
          </div>

          <Button type="button" onClick={openCreate} disabled={isBusy} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add question
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
          <CardDescription>Drag and drop to reorder. Changes save immediately.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {questionsQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : questionsQuery.isError ? (
            <p className="text-destructive text-sm">
              {questionsQuery.error instanceof Error ? questionsQuery.error.message : "Could not load questions."}
            </p>
          ) : sortedDrafts.length === 0 ? (
            <p className="rounded-2xl border border-dashed py-10 text-center text-muted-foreground text-sm">
              No registration questions yet.
            </p>
          ) : (
            <SortableVerticalList
              className="flex flex-col gap-3"
              items={sortableItems}
              onReorder={handleReorder}
              renderItem={(q, dragListeners) => (
                <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="cursor-move touch-none p-1 text-muted-foreground">
                      <GripVertical className="h-5 w-5" {...dragListeners} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{q.question}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-muted-foreground text-sm">
                        <Type className="h-4 w-4" />
                        <span>{questionTypeLabel(q.type)}</span>
                        {q.is_required ? (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-xs">Required</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => openEdit(q)} disabled={isBusy}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(q.clientId)}
                      disabled={isBusy}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            />
          )}
        </CardContent>
      </Card>

      <CreateQuestionDrawer
        mode={drawerMode}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        initial={drawerMode === "edit" ? editingQuestion : newDraftQuestion()}
        onSave={handleSave}
      />
    </main>
  );
}
