"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Tooltip } from "@/lib/client/tooltip";
import { WebClipboardWriter } from "@/lib/platform/web-clipboard";

export function CopyTitleButton({ title }: { title: string }) {
  const clipboard = useMemo(() => new WebClipboardWriter(), []);
  const resetTimer = useRef<number | null>(null);
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(
    () => () => {
      if (resetTimer.current !== null) {
        window.clearTimeout(resetTimer.current);
      }
    },
    []
  );

  async function copyTitle() {
    try {
      await clipboard.writeText(title);
      setState("copied");
    } catch {
      setState("error");
    }

    if (resetTimer.current !== null) {
      window.clearTimeout(resetTimer.current);
    }
    resetTimer.current = window.setTimeout(() => setState("idle"), 1600);
  }

  const label = state === "copied" ? "已复制番名" : state === "error" ? "复制失败" : "复制番名";

  return (
    <Tooltip label={label}>
      <button
        aria-label={`${label}：${title}`}
        className={`relative z-20 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] transition-colors ${
          state === "copied"
            ? "bg-[var(--teal-soft)] text-[var(--teal)]"
            : state === "error"
              ? "bg-[var(--accent-soft)] text-[var(--danger)]"
              : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
        }`}
        onClick={(event) => {
          event.stopPropagation();
          void copyTitle();
        }}
        type="button"
      >
        {state === "copied" ? (
          <Check aria-hidden className="h-3.5 w-3.5" />
        ) : (
          <Copy aria-hidden className="h-3.5 w-3.5" />
        )}
      </button>
    </Tooltip>
  );
}
