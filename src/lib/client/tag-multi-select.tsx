"use client";

import * as Checkbox from "@radix-ui/react-checkbox";
import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, Search, Tags, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

export type TagFilterOption = {
  count: number;
  value: string;
};

export function TagMultiSelect({
  onChange,
  options,
  value
}: {
  onChange: (value: string[]) => void;
  options: TagFilterOption[];
  value: string[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const selected = useMemo(() => new Set(value), [value]);
  const visibleOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return normalizedQuery
      ? options.filter((option) => option.value.toLocaleLowerCase().includes(normalizedQuery))
      : options;
  }, [options, query]);

  function toggle(tag: string) {
    onChange(selected.has(tag) ? value.filter((item) => item !== tag) : [...value, tag]);
  }

  return (
    <Popover.Root
      onOpenChange={(open) => {
        if (!open) {
          setQuery("");
        }
      }}
    >
      <Popover.Trigger asChild>
        <button
          aria-label="标签筛选"
          className="inline-flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-[6px] border border-[var(--line-strong)] bg-white px-3 text-sm text-[var(--foreground)] outline-none transition-[border-color,box-shadow] hover:border-[var(--muted)] focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent-soft)] data-[state=open]:border-[var(--accent)]"
          type="button"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Tags aria-hidden className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" />
            <span className="truncate">
              {value.length === 0
                ? "全部标签"
                : value.length === 1
                  ? value[0]
                  : `已选 ${value.length} 个`}
            </span>
          </span>
          <ChevronDown aria-hidden className="h-4 w-4 shrink-0 text-[var(--muted)]" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          className="z-50 w-[340px] overflow-hidden rounded-[6px] border border-[var(--line-strong)] bg-white shadow-[var(--shadow-float)]"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            inputRef.current?.focus();
          }}
          sideOffset={6}
        >
          <div className="border-b border-[var(--line)] p-3">
            <label className="flex h-9 items-center gap-2 rounded-[5px] border border-[var(--line-strong)] bg-[var(--surface)] px-2.5 focus-within:border-[var(--accent)] focus-within:bg-white">
              <Search aria-hidden className="h-4 w-4 shrink-0 text-[var(--muted)]" />
              <span className="sr-only">搜索标签</span>
              <input
                className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-[#9aa0a7]"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索标签"
                ref={inputRef}
                type="search"
                value={query}
              />
              {query ? (
                <button
                  aria-label="清空标签搜索"
                  className="grid h-6 w-6 place-items-center rounded-[4px] text-[var(--muted)] hover:bg-white hover:text-[var(--foreground)]"
                  onClick={() => setQuery("")}
                  type="button"
                >
                  <X aria-hidden className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </label>

            {value.length > 0 ? (
              <div className="mt-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-[var(--muted)]">
                    已选{" "}
                    <strong className="font-semibold text-[var(--foreground)]">
                      {value.length}
                    </strong>
                  </span>
                  <button
                    className="text-xs font-medium text-[var(--accent-strong)] hover:underline"
                    onClick={() => onChange([])}
                    type="button"
                  >
                    全部清除
                  </button>
                </div>
                <div className="thin-scrollbar mt-2 flex max-h-[58px] flex-wrap gap-1.5 overflow-y-auto pr-1">
                  {value.map((tag) => (
                    <button
                      aria-label={`移除标签：${tag}`}
                      className="inline-flex h-6 max-w-[145px] items-center gap-1 rounded-[4px] bg-[var(--accent-soft)] px-2 text-[11px] font-medium text-[var(--accent-strong)] hover:bg-[#f8d9d6]"
                      key={tag}
                      onClick={() => toggle(tag)}
                      type="button"
                    >
                      <span className="truncate">{tag}</span>
                      <X aria-hidden className="h-3 w-3 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="thin-scrollbar max-h-[292px] overflow-y-auto p-1.5">
            {visibleOptions.length === 0 ? (
              <div className="px-3 py-8 text-center text-xs text-[var(--muted)]">
                没有匹配的标签
              </div>
            ) : (
              visibleOptions.map((option) => (
                <label
                  className="flex h-9 cursor-pointer select-none items-center gap-2.5 rounded-[4px] px-2.5 text-sm transition-colors hover:bg-[var(--surface)]"
                  key={option.value}
                >
                  <Checkbox.Root
                    aria-label={option.value}
                    checked={selected.has(option.value)}
                    className="grid h-4 w-4 shrink-0 place-items-center rounded-[3px] border border-[var(--line-strong)] bg-white text-white outline-none data-[state=checked]:border-[var(--accent)] data-[state=checked]:bg-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent-soft)]"
                    onCheckedChange={() => toggle(option.value)}
                  >
                    <Checkbox.Indicator>
                      <Check aria-hidden className="h-3 w-3" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <span className="min-w-0 flex-1 truncate">{option.value}</span>
                  <span className="text-[11px] tabular-nums text-[var(--muted)]">
                    {option.count}
                  </span>
                </label>
              ))
            )}
          </div>

          <div className="border-t border-[var(--line)] px-3 py-2 text-[11px] text-[var(--muted)]">
            {visibleOptions.length} / {options.length} 个标签
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
