"use client";

import { useState } from "react";

import { GripVertical, Plus, Trash } from "lucide-react";
import { toast } from "sonner";

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
} from "@/app/dashboard/events/_components/questions/draft";
import { SortableVerticalList } from "@/app/dashboard/events/_components/questions/sortable-vertical-list";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

      <div className="no-scrollbar mt-4 flex w-full gap-4 overflow-y-auto px-4 pt-4">
        <div className="flex w-full flex-col gap-6">
          <div>
            <Field className="gap-1.5">
              <FieldLabel htmlFor="question-text">Question</FieldLabel>
              <Input
                id="question-text"
                autoComplete="off"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className={sharpInputClassName}
                placeholder="e.g. Are you smart?"
              />
            </Field>
          </div>

          <div>
            <Field className="gap-1.5">
              <FieldLabel htmlFor="question-type">Question Type</FieldLabel>
              <Select
                value={questionType}
                onValueChange={(v) => {
                  setQuestionType(v as QuestionType);
                  if (v === single_choice || v === multiple_choice) {
                    if (options.length < 2) {
                      setOptions([newDraftQuestionOption(), newDraftQuestionOption()]);
                    }
                  }
                }}
              >
                <SelectTrigger id="question-type" className={`${sharpInputClassName} w-full`}>
                  <SelectValue placeholder="Select question type" />
                </SelectTrigger>
                <SelectContent>
                  {question_types.map(({ label, value }) => (
                    <SelectItem value={value} key={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div>
            <FieldLabel>
              <Field orientation="horizontal">
                <Checkbox
                  id="question-required"
                  checked={isRequired}
                  onCheckedChange={(checked) => setIsRequired(checked === true)}
                />
                <FieldContent>
                  <FieldTitle>Required</FieldTitle>
                  <FieldDescription>Attendees must answer.</FieldDescription>
                </FieldContent>
              </Field>
            </FieldLabel>
          </div>

          <div>
            {isChoiceType(questionType as QuestionType) && (
              <div className="flex flex-col gap-4 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-500 text-xs uppercase tracking-widest">Options</span>
                  <span className="font-medium text-gray-400 text-xs">{options.length} items</span>
                </div>

                <SortableVerticalList
                  className="flex flex-col gap-3"
                  items={options}
                  onReorder={handleOptionsReorder}
                  renderItem={(option: DraftQuestionOption, dragListeners) => (
                    <div className="group flex items-start gap-2">
                      <div className="mt-2 cursor-move touch-none p-1 text-gray-300 transition-colors hover:text-gray-500">
                        <GripVertical className="h-5 w-5" {...dragListeners} />
                      </div>

                      <div className="flex grow flex-col gap-2">
                        <Input
                          value={option.value}
                          onChange={(e) => updateOption(option.id, { value: e.target.value })}
                          className={sharpInputClassName}
                          placeholder="Option"
                        />
                      </div>

                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="destructive"
                          className="mt-2 p-2 opacity-0 transition-colors group-hover:opacity-100"
                          onClick={() => deleteOption(option.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                />

                <Button
                  type="button"
                  className="mt-2 flex items-center gap-1.5 self-start px-4 py-2"
                  onClick={addOption}
                >
                  <Plus className="h-4 w-4" />
                  Add Option
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col overflow-y-auto border-gray-100 border-t bg-gray-50/10 p-6 md:border-t-0 md:border-l">
          <span className="mb-4 font-bold text-gray-400 text-xs uppercase tracking-widest">Attendee Preview</span>
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h4 className="font-medium text-base text-gray-500 italic leading-snug">
              {question ? question : "Your question will appear here..."}
            </h4>
            {questionType === text && (
              <div>
                <Input className={sharpInputClassName} placeholder="Type your answer..." disabled />
              </div>
            )}

            {isChoiceType(questionType as QuestionType) && (
              <div className="flex flex-col gap-4">
                {options.map((opt) => (
                  <label
                    key={opt.id}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#ff545a]/30 bg-red-50/30 p-3 transition-colors"
                  >
                    <input
                      type={questionType === multiple_choice ? "checkbox" : "radio"}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#ff545a] focus:ring-[#ff545a]"
                      disabled
                    />
                    <span className="font-medium text-gray-900 text-sm">{opt.value.trim() || "Option"}</span>
                  </label>
                ))}
              </div>
            )}

            {questionType === yes_no && (
              <div className="flex flex-col gap-4">
                {["Yes", "No"].map((label) => (
                  <label
                    key={label}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#ff545a]/30 bg-red-50/30 p-3 transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#ff545a] focus:ring-[#ff545a]"
                      disabled
                    />
                    <span className="font-medium text-gray-900 text-sm">{label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <DrawerFooter>
        <div className="flex w-full justify-end gap-4">
          <Button variant="secondary" className="px-4 py-2" type="button" onClick={onClose}>
            Cancel
          </Button>

          <Button className="px-4 py-2" type="button" onClick={handleSubmit}>
            {mode === "edit" ? "Save" : "Add Question"}
          </Button>
        </div>
      </DrawerFooter>
    </>
  );
}
