"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";

const amountFormatter = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

function formatAmountDigits(digits: string): string {
  const clean = digits.replace(/\D/g, "");
  if (!clean) return "";
  const n = Number(clean);
  if (!Number.isFinite(n)) return clean;
  return amountFormatter.format(n);
}

function countDigitsBeforeCursor(value: string, cursorIndex: number): number {
  let count = 0;
  for (let i = 0; i < Math.min(cursorIndex, value.length); i++) {
    const c = value[i];
    if (c >= "0" && c <= "9") count++;
  }
  return count;
}

function cursorIndexAfterNthDigit(value: string, nthDigit: number): number {
  if (nthDigit <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (c >= "0" && c <= "9") {
      seen++;
      if (seen === nthDigit) return i + 1;
    }
  }
  return value.length;
}

export type AmountInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "defaultValue" | "onChange" | "type"
> & {
  value: string;
  onChange: (digitsOnly: string) => void;
};

export const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(function AmountInput(
  { value, onChange, ...props },
  forwardedRef,
) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const caretDigitsRef = React.useRef<number | null>(null);

  const composedRef = React.useCallback(
    (el: HTMLInputElement | null) => {
      inputRef.current = el;
      if (typeof forwardedRef === "function") forwardedRef(el);
      else if (forwardedRef) forwardedRef.current = el;
    },
    [forwardedRef],
  );

  React.useLayoutEffect(() => {
    const next = caretDigitsRef.current;
    if (next == null) return;
    caretDigitsRef.current = null;

    const el = inputRef.current;
    if (!el) return;
    const idx = cursorIndexAfterNthDigit(el.value, next);
    el.setSelectionRange(idx, idx);
  });

  return (
    <Input
      {...props}
      ref={composedRef}
      inputMode={props.inputMode ?? "numeric"}
      pattern={props.pattern ?? "\\d*"}
      value={formatAmountDigits(String(value ?? ""))}
      onChange={(e) => {
        const raw = e.target.value ?? "";
        const caret = e.target.selectionStart ?? raw.length;
        caretDigitsRef.current = countDigitsBeforeCursor(raw, caret);
        onChange(raw.replace(/\D/g, ""));
      }}
    />
  );
});
