"use client";

import * as React from "react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type MonthYearPickerProps = {
  value: Date;
  onChange: (value: Date) => void;
  fromYear?: number;
  toYear?: number;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
};

export function MonthYearPicker({
  value,
  onChange,
  fromYear = 2025,
  toYear = new Date().getFullYear(),
  disabled,
  className,
  placeholder = "Select month",
}: MonthYearPickerProps) {
  const [open, setOpen] = React.useState(false);

  const displayValue = value ? format(value, "MMM yyyy") : placeholder;

  return (
    <Popover open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn("justify-start font-normal", !value && "text-muted-foreground", className)}
          onClick={() => {
            if (!disabled) setOpen(true);
          }}
        >
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="end">
        <Calendar
          mode="single"
          selected={value}
          month={value}
          onSelect={(d) => {
            if (!d) return;
            const normalized = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
            onChange(normalized);
            setOpen(false);
          }}
          onMonthChange={(nextMonth) => {
            const normalized = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1, 0, 0, 0, 0);
            onChange(normalized);
          }}
          captionLayout="dropdown"
          fromYear={fromYear}
          toYear={toYear}
        />
      </PopoverContent>
    </Popover>
  );
}
