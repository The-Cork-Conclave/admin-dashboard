"use client";

import { useMemo, useState } from "react";

import { GripVertical, Pencil, Plus, Trash, Type } from "lucide-react";

import { CreateQuestionDrawer } from "@/app/dashboard/events/_components/questions/create-question-drawer";
import type { DraftQuestion } from "@/app/dashboard/events/_components/questions/draft";
import { questionTypeLabel, reindexQuestions } from "@/app/dashboard/events/_components/questions/draft";
import { SortableVerticalList } from "@/app/dashboard/events/_components/questions/sortable-vertical-list";
import { Button } from "@/components/ui/button";

export function RegistrationQuestions({
  previous,
  questions,
  onQuestionsChange,
  onSubmit,
  isSubmitting,
}: {
  previous: () => void;
  questions: DraftQuestion[];
  onQuestionsChange: (questions: DraftQuestion[]) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [editingQuestion, setEditingQuestion] = useState<DraftQuestion | undefined>();

  const sortedQuestions = useMemo(() => [...questions].sort((a, b) => a.sort_order - b.sort_order), [questions]);

  const sortableItems = sortedQuestions.map((q) => ({ ...q, id: q.clientId }));

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

  const handleSave = (question: DraftQuestion) => {
    const existingIndex = questions.findIndex((q) => q.clientId === question.clientId);
    if (existingIndex >= 0) {
      const next = [...questions];
      next[existingIndex] = question;
      onQuestionsChange(reindexQuestions(next));
      return;
    }

    onQuestionsChange(
      reindexQuestions([
        ...questions,
        {
          ...question,
          sort_order: questions.length,
        },
      ]),
    );
  };

  const handleDelete = (clientId: string) => {
    onQuestionsChange(reindexQuestions(questions.filter((q) => q.clientId !== clientId)));
  };

  const handleReorder = (items: Array<DraftQuestion & { id: string }>) => {
    const reordered = items.map((item, index) => {
      const { id: _id, ...rest } = item;
      return { ...rest, sort_order: index };
    });
    onQuestionsChange(reordered);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div className="flex w-full justify-end">
          <Button className="w-full px-4 sm:w-auto" variant="outline" type="button" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Create Question
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          {sortedQuestions.length === 0 ? (
            <p className="rounded-2xl border border-dashed py-8 text-center text-muted-foreground text-sm">
              No registration questions yet. Add one or submit without questions.
            </p>
          ) : (
            <SortableVerticalList
              className="flex flex-col gap-4"
              items={sortableItems}
              onReorder={handleReorder}
              renderItem={(question, dragListeners) => (
                <div className="group flex items-center justify-between rounded-2xl border border-accent-foreground/10 p-4 shadow-lg transition-transform hover:-translate-y-0.5 md:p-6">
                  <div className="flex w-full items-center gap-4">
                    <div className="cursor-move touch-none p-1 text-gray-300 transition-colors hover:text-gray-500">
                      <GripVertical className="h-5 w-5" {...dragListeners} />
                    </div>
                    <div className="flex grow flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900 text-lg tracking-tight">{question.question}</h3>
                        {question.is_required ? (
                          <span className="rounded-md bg-red-50 px-2 py-0.5 font-bold text-[10px] text-red-600 uppercase tracking-wider">
                            Required
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 font-medium text-gray-500 text-sm">
                        <Type className="h-4 w-4" />
                        <span>{questionTypeLabel(question.type)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex items-center gap-1.5"
                      onClick={() => openEdit(question)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="hidden sm:inline">Update</span>
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      className="flex items-center gap-1.5"
                      onClick={() => handleDelete(question.clientId)}
                    >
                      <Trash className="h-4 w-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </div>
              )}
            />
          )}
        </div>

        <CreateQuestionDrawer
          mode={drawerMode}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          initial={drawerMode === "edit" ? editingQuestion : undefined}
          onSave={handleSave}
        />
      </div>

      <div className="flex flex-col-reverse items-center justify-between gap-4 border-border border-t bg-muted/30 px-6 py-5 sm:flex-row md:px-8">
        <Button
          variant="secondary"
          onClick={previous}
          className="w-full sm:w-auto"
          type="button"
          disabled={isSubmitting}
        >
          Back
        </Button>

        <Button className="w-full px-4 sm:w-auto" type="button" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </div>
  );
}
