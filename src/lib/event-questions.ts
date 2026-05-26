export const yes_no = "yes_no" as const;
export const text = "text" as const;
export const single_choice = "single_choice" as const;
export const multiple_choice = "multiple_choice" as const;

export type QuestionType = typeof yes_no | typeof text | typeof single_choice | typeof multiple_choice;

export const question_types: { label: string; value: QuestionType }[] = [
  { label: "Yes/No", value: yes_no },
  { label: "Text", value: text },
  { label: "Single Choice", value: single_choice },
  { label: "Multiple Choice", value: multiple_choice },
];

export function questionTypeLabel(type: string): string {
  return question_types.find((t) => t.value === type)?.label ?? type;
}

export function isChoiceQuestionType(type: string): boolean {
  return type === single_choice || type === multiple_choice;
}
