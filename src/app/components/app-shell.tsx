"use client";

import { Compass, Database, HardDrive, LibraryBig, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { TooltipProvider } from "@/lib/client/tooltip";
import { useCollection } from "@/lib/client/use-collection";

const navigation = [
  { href: "/", icon: Compass, label: "番剧发现" },
  { href: "/collection", icon: LibraryBig, label: "我的收藏" }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { items, ready } = useCollection();

  return (
    <TooltipProvider>
      <div className="grid min-h-screen min-w-[1240px] grid-cols-[212px_minmax(0,1fr)] bg-[var(--background)]">
        <aside className="sticky top-0 flex h-screen flex-col border-r border-[var(--sidebar-line)] bg-[var(--sidebar)] px-3 py-4 text-white">
          <Link className="flex items-center gap-3 rounded-[6px] px-2 py-2" href="/">
            <span className="grid h-9 w-9 place-items-center rounded-[6px] bg-[var(--accent)] shadow-[0_8px_22px_rgba(221,62,53,0.28)]">
              <Sparkles aria-hidden className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0">
              <h1 className="truncate text-[15px] font-semibold leading-5">Bangumi Show</h1>
              <span className="block text-[11px] text-[var(--sidebar-muted)]">ANIME DESK</span>
            </span>
          </Link>

          <nav aria-label="主导航" className="mt-8 grid gap-1">
            <div className="px-3 pb-2 text-[11px] font-medium text-[var(--sidebar-muted)]">
              工作台
            </div>
            {navigation.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`flex h-10 items-center gap-3 rounded-[6px] px-3 text-sm transition-colors ${
                    active
                      ? "bg-white/10 font-medium text-white"
                      : "text-[var(--sidebar-muted)] hover:bg-white/[0.06] hover:text-white"
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  <Icon
                    aria-hidden
                    className={active ? "h-[18px] w-[18px] text-[#ff766d]" : "h-[18px] w-[18px]"}
                  />
                  <span>{item.label}</span>
                  {item.href === "/collection" && ready ? (
                    <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[11px] tabular-nums text-white">
                      {items.length}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto grid gap-3 px-2">
            <div className="rounded-[6px] border border-white/10 bg-white/[0.04] px-3 py-3">
              <div className="flex items-center gap-2 text-xs font-medium text-white">
                <Database aria-hidden className="h-4 w-4 text-[#71c4bd]" />
                Bangumi 数据源
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--sidebar-muted)]">
                <HardDrive aria-hidden className="h-3.5 w-3.5" />
                本地收藏
              </div>
            </div>
            <div className="px-1 text-[10px] text-[#7f858e]">v0.1 · LOCAL FIRST</div>
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </TooltipProvider>
  );
}
