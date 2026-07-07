"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

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
  size?: "normal" | "compact";
  value: T;
}) {
  return (
    <div className="grid gap-1">
      <span className={labelVisible ? "text-xs text-[var(--muted)]" : "sr-only"}>{label}</span>
      <Select.Root onValueChange={onChange} value={value}>
        <Select.Trigger
          aria-label={label}
          className={`inline-flex items-center justify-between gap-2 rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none transition-colors hover:border-[var(--accent)] data-[state=open]:border-[var(--accent)] ${
            size === "compact" ? "h-9 min-w-24" : "h-10 w-full"
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
            className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-[var(--line)] bg-white shadow-xl"
            position="popper"
            sideOffset={4}
          >
            <Select.Viewport className="p-1">
              {options.map((option) => (
                <Select.Item
                  className="relative flex h-9 cursor-default select-none items-center rounded px-8 text-sm outline-none data-[highlighted]:bg-[var(--accent-soft)] data-[highlighted]:text-[var(--foreground)]"
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
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
