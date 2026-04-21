"use client";

import * as React from "react";

import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DateTimePickerProps = {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  placeholder?: string;
  className?: string;
  timeClassName?: string;
};

function parseDatetimeLocal(value: string): Date | undefined {
  // `datetime-local` format: `YYYY-MM-DDTHH:mm`
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return undefined;

  const [y, m, d] = datePart.split("-").map((v) => Number(v));
  const [hh, mm] = timePart.split(":").map((v) => Number(v));
  if (!y || !m || !d) return undefined;
  if (Number.isNaN(hh) || Number.isNaN(mm)) return undefined;

  const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
  return Number.isNaN(dt.getTime()) ? undefined : dt;
}

function toDatetimeLocalString(date: Date): string {
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return [
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`,
    `${pad2(date.getHours())}:${pad2(date.getMinutes())}`,
  ].join("T");
}

function toTimeString(date: Date): string {
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function DateTimePicker({
  id,
  value,
  onChange,
  disabled,
  placeholder = "Select date & time",
  className,
  timeClassName,
  ...ariaProps
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const parsed = React.useMemo(() => (value ? parseDatetimeLocal(value) : undefined), [value]);
  const selectedDate = parsed;
  const selectedTime = parsed ? toTimeString(parsed) : "09:00";

  const displayValue = selectedDate ? format(selectedDate, "d MMM yyyy, HH:mm") : "Select date & time";

  const handleSelectDate = (nextDate: Date | undefined) => {
    if (!nextDate) return;
    const base = selectedDate ?? new Date();
    const merged = new Date(
      nextDate.getFullYear(),
      nextDate.getMonth(),
      nextDate.getDate(),
      base.getHours(),
      base.getMinutes(),
      0,
      0,
    );
    onChange?.(toDatetimeLocalString(merged));
  };

  const handleChangeTime = (time: string) => {
    const [hhStr, mmStr] = time.split(":");
    const hh = Number(hhStr);
    const mm = Number(mmStr);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return;

    const base = selectedDate ?? new Date();
    const merged = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate(),
      hh,
      mm,
      0,
      0,
    );
    onChange?.(toDatetimeLocalString(merged));
  };

  const handleClear = () => {
    onChange?.("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
      <PopoverTrigger asChild>
        <Input
          id={id}
          role="button"
          readOnly
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "cursor-pointer text-left",
            !selectedDate &&
              "text-[color-mix(in_oklch,var(--muted-foreground)_38%,var(--background))]",
            className,
          )}
          onClick={() => {
            if (!disabled) setOpen(true);
          }}
          {...ariaProps}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <div className="border-b">
          <Calendar mode="single" selected={selectedDate} onSelect={handleSelectDate} />
        </div>
        <div className="flex items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">Time</span>
            <Input
              type="time"
              step={60}
              value={selectedTime}
              onChange={(e) => handleChangeTime(e.target.value)}
              disabled={disabled}
              className={cn("w-32", timeClassName ?? className)}
            />
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={handleClear} disabled={disabled}>
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

