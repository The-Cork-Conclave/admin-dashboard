import { format, isValid, parseISO } from "date-fns";

import type { RegistrationQuestionResponse, RegistrationRow } from "./schema";

export function getEffectiveRegistrationStatus(
  registration: Pick<RegistrationRow, "status" | "checked_in_at" | "is_complimentary">,
) {
  if (registration.checked_in_at) return "checked_in";
  if (registration.is_complimentary && (registration.status === "confirmed" || registration.status === "invited")) {
    return "invited";
  }
  return registration.status;
}

export function formatRegistrationStatusLabel(status: string) {
  if (status === "pending_payment") return "Pending";
  if (status === "checked_in") return "Checked in";
  if (status === "confirmed") return "Paid";
  if (status === "invited") return "Invited";
  return status;
}

export function formatRegistrationDate(value?: string | null) {
  if (!value) return "—";

  const d = parseISO(value);
  if (!isValid(d)) return "—";

  return format(d, "do MMMM yyyy h:mm a");
}

export function formatQuestionAnswer(response: RegistrationQuestionResponse): string {
  if (response.type === "text") {
    return response.answer_text?.trim() || "—";
  }

  if (response.type === "yes_no") {
    const value = response.answer_text?.trim().toLowerCase();
    if (value === "yes") return "Yes";
    if (value === "no") return "No";
    return response.answer_text?.trim() || "—";
  }

  if (response.type === "single_choice" || response.type === "multiple_choice") {
    const options = response.answer_options?.filter((option) => option.trim().length > 0) ?? [];
    return options.length > 0 ? options.join(", ") : "—";
  }

  return "—";
}
