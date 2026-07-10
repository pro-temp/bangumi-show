"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

export function HeadlessSelect<T extends string>({
  label,
  labelVisible = true,
  onChange,
  options,
  size = "normal",
  value
}: {
  label: string;
  labelVisible?: boolean;
  onChange: (value: T) => void;
  options: { label: string; value: T }[];
  size?: "normal" | "compact" | "large";
  value: T;
}) {
  return (
    <div className="grid gap-1">
      <span className={labelVisible ? "text-xs text-[var(--muted)]" : "sr-only"}>{label}</span>
      <Select.Root onValueChange={onChange} value={value}>
        <Select.Trigger
          aria-label={label}
          className={`inline-flex items-center justify-between gap-2 rounded-[6px] border border-[var(--line-strong)] bg-[var(--panel)] px-3 text-sm text-[var(--foreground)] outline-none transition-[border-color,box-shadow,background-color] hover:border-[var(--muted)] focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent-soft)] data-[state=open]:border-[var(--accent)] ${
            size === "compact"
              ? "h-9 min-w-24"
              : size === "large"
                ? "h-11 w-full min-w-0"
                : "h-10 w-full min-w-0"
          }`}
          type="button"
        >
          <Select.Value />
          <Select.Icon>
            <ChevronDown aria-hidden className="h-4 w-4 text-[var(--muted)]" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            className="z-50 max-h-[320px] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[6px] border border-[var(--line-strong)] bg-[var(--panel)] shadow-[var(--shadow-float)]"
            position="popper"
            sideOffset={4}
          >
            <Select.ScrollUpButton className="flex h-7 items-center justify-center text-[var(--muted)]">
              <ChevronUp aria-hidden className="h-4 w-4" />
            </Select.ScrollUpButton>
            <Select.Viewport className="max-h-[272px] p-1">
              {options.map((option) => (
                <Select.Item
                  className="relative flex h-9 cursor-default select-none items-center rounded-[4px] px-8 text-sm outline-none data-[highlighted]:bg-[var(--accent-soft)] data-[highlighted]:text-[var(--accent-strong)]"
                  key={option.value}
                  value={option.value}
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                    <Check aria-hidden className="h-4 w-4 text-[var(--accent)]" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
            <Select.ScrollDownButton className="flex h-7 items-center justify-center text-[var(--muted)]">
              <ChevronDown aria-hidden className="h-4 w-4" />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
