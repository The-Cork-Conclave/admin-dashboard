"use client";

import { useState } from "react";

import { GripVertical, Plus, Trash } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
  type DraftQuestion,
  type DraftQuestionOption,
  multiple_choice,
  newDraftQuestionOption,
  type QuestionType,
  question_types,
  sharpInputClassName,
  single_choice,
  text,
  yes_no,
} from "./draft";
import { SortableVerticalList } from "./sortable-vertical-list";

function isChoiceType(type: QuestionType) {
  return type === single_choice || type === multiple_choice;
}

function draftFromInitial(initial?: DraftQuestion): {
  question: string;
  questionType: QuestionType | "";
  isRequired: boolean;
  options: DraftQuestionOption[];
} {
  if (!initial) {
    return {
      question: "",
      questionType: "",
      isRequired: false,
      options: [newDraftQuestionOption(), newDraftQuestionOption()],
    };
  }

  return {
    question: initial.question,
    questionType: initial.type,
    isRequired: initial.is_required,
    options:
      initial.options && initial.options.length > 0
        ? initial.options.map((o) => ({ ...o, id: o.id || crypto.randomUUID() }))
        : [newDraftQuestionOption(), newDraftQuestionOption()],
  };
}

export function CreateQuestionDrawer({
  mode,
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: DraftQuestion;
  onSave: (question: DraftQuestion) => void;
}) {
  const formKey = mode === "edit" ? (initial?.clientId ?? "edit") : "create";

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="w-screen! sm:min-w-175 xl:min-w-250">
        {open ? (
          <QuestionDrawerForm
            key={formKey}
            mode={mode}
            initial={initial}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function QuestionDrawerForm({
  mode,
  initial,
  onSave,
  onClose,
}: {
  mode: "create" | "edit";
  initial?: DraftQuestion;
  onSave: (question: DraftQuestion) => void;
  onClose: () => void;
}) {
  const draft = draftFromInitial(mode === "edit" ? initial : undefined);
  const [question, setQuestion] = useState(draft.question);
  const [questionType, setQuestionType] = useState<QuestionType | "">(draft.questionType);
  const [isRequired, setIsRequired] = useState(draft.isRequired);
  const [options, setOptions] = useState<DraftQuestionOption[]>(draft.options);

  const addOption = () => {
    setOptions([...options, newDraftQuestionOption()]);
  };

  const deleteOption = (id: string) => {
    setOptions(options.filter((o) => o.id !== id));
  };

  const updateOption = (id: string, patch: Partial<DraftQuestionOption>) => {
    setOptions(options.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  };

  const handleOptionsReorder = (next: DraftQuestionOption[]) => {
    setOptions(next.map((opt, index) => ({ ...opt, sort_order: index })));
  };

  const handleSubmit = () => {
    if (!question.trim()) {
      toast.error("Please enter a question.");
      return;
    }
    if (!questionType) {
      toast.error("Please select a question type.");
      return;
    }

    if (isChoiceType(questionType)) {
      const filled = options.filter((o) => o.value.trim());
      if (filled.length < 2) {
        toast.error("Choice questions need at least 2 options.");
        return;
      }
      for (const opt of options) {
        if (!opt.value.trim()) {
          toast.error("Each option must have a value.");
          return;
        }
      }
    }

    const saved: DraftQuestion = {
      clientId: initial?.clientId ?? crypto.randomUUID(),
      question: question.trim(),
      type: questionType,
      is_required: isRequired,
      sort_order: initial?.sort_order ?? 0,
      options: isChoiceType(questionType)
        ? options.map((opt, index) => ({
            ...opt,
            value: opt.value.trim(),
            sort_order: index,
          }))
        : undefined,
    };

    onSave(saved);
    onClose();
  };

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{mode === "edit" ? "Update Question" : "Add New Question"}</DrawerTitle>
      </DrawerHeader>

      <div className="flex flex-col gap-6 overflow-y-auto px-4 py-6 sm:px-6">
        <Field>
          <FieldTitle>Preview</FieldTitle>
          <FieldDescription>How this question will appear to attendees.</FieldDescription>
          <FieldContent className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{question ? question : "Your question will appear here..."}</p>
              {isRequired ? <span className="text-destructive text-xs">Required</span> : null}
            </div>
            {questionType === text ? (
              <Input disabled placeholder="Attendee's answer..." className={sharpInputClassName} />
            ) : null}
            {isChoiceType(questionType as QuestionType) ? (
              <div className="space-y-2">
                {(options ?? []).map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 text-sm">
                    <input
                      type={questionType === multiple_choice ? "checkbox" : "radio"}
                      disabled
                      name="preview"
                      className="size-4"
                    />
                    <span>{opt.value ? opt.value : "Option"}</span>
                  </label>
                ))}
              </div>
            ) : null}
            {questionType === yes_no ? (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" disabled name="preview" className="size-4" /> <span>Yes</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" disabled name="preview" className="size-4" /> <span>No</span>
                </label>
              </div>
            ) : null}
          </FieldContent>
        </Field>

        <Field>
          <FieldTitle>Question Details</FieldTitle>
          <FieldDescription>Configure the question content and type.</FieldDescription>
          <FieldContent className="space-y-4">
            <div className="space-y-2">
              <FieldLabel htmlFor="question-text">Question</FieldLabel>
              <Input
                id="question-text"
                className={sharpInputClassName}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter question text"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="question-type">Question Type</FieldLabel>
              <Select
                value={questionType}
                onValueChange={(v) => {
                  setQuestionType(v as QuestionType);
                  const isChoice = isChoiceType(v as QuestionType);
                  if (isChoice) {
                    setOptions([newDraftQuestionOption(), newDraftQuestionOption()]);
                  } else {
                    setOptions([]);
                  }
                }}
              >
                <SelectTrigger id="question-type" className={`${sharpInputClassName} w-full`}>
                  <SelectValue placeholder="Select question type" />
                </SelectTrigger>
                <SelectContent>
                  {question_types.map(({ label, value }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="question-required"
                checked={isRequired}
                onCheckedChange={(v) => setIsRequired(Boolean(v))}
              />
              <FieldLabel htmlFor="question-required">Required</FieldLabel>
            </div>
          </FieldContent>
        </Field>

        {isChoiceType(questionType as QuestionType) ? (
          <Field>
            <FieldTitle>Options</FieldTitle>
            <FieldDescription>Drag to reorder. Each option needs a value.</FieldDescription>
            <FieldContent className="space-y-3">
              <SortableVerticalList
                className="flex flex-col gap-3"
                items={options}
                onReorder={handleOptionsReorder}
                renderItem={(option, dragListeners) => (
                  <div className="group flex items-start gap-2">
                    <div className="mt-2 cursor-move touch-none p-1 text-gray-300 transition-colors hover:text-gray-500">
                      <GripVertical className="h-5 w-5" {...dragListeners} />
                    </div>

                    <div className="w-full space-y-1.5">
                      <FieldLabel htmlFor={`option-value-${option.id}`}>Option</FieldLabel>
                      <Input
                        id={`option-value-${option.id}`}
                        className={sharpInputClassName}
                        value={option.value}
                        onChange={(e) => updateOption(option.id, { value: e.target.value })}
                        placeholder="e.g. VIP"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteOption(option.id)}
                    >
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Delete option</span>
                    </Button>
                  </div>
                )}
              />

              <div>
                <Button type="button" variant="outline" onClick={addOption}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add option
                </Button>
              </div>
            </FieldContent>
          </Field>
        ) : null}
      </div>

      <DrawerFooter className="flex flex-col gap-3 border-border border-t bg-muted/30 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
        <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit} className="w-full sm:w-auto">
          {mode === "edit" ? "Save" : "Add Question"}
        </Button>
      </DrawerFooter>
    </>
  );
}
