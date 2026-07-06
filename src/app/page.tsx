import { Search, SlidersHorizontal, Star } from "lucide-react";
import { currentSeason } from "@/lib/anime/season";
import { sampleSeasonAnime } from "@/lib/sample-data/season";

export default function Home() {
  const season = currentSeason(new Date());

  return (
    <main className="min-h-screen">
      <section className="border-b border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-normal text-[var(--foreground)]">
                Bangumi Show
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">当前季度番表与动画查询</p>
            </div>
            <div className="text-sm text-[var(--muted)]">
              {season.year} 年 {season.label}
            </div>
          </div>

          <form className="flex flex-col gap-3 rounded-md border border-[var(--line)] bg-white p-3 shadow-sm sm:flex-row">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 py-2">
              <Search aria-hidden className="h-5 w-5 shrink-0 text-[var(--muted)]" />
              <span className="sr-only">搜索动画</span>
              <input
                className="min-w-0 flex-1 border-0 bg-transparent text-base outline-none placeholder:text-slate-400"
                name="q"
                placeholder="搜索中文名、日文名、罗马音或别名"
                type="search"
              />
            </label>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-medium text-white"
              type="submit"
            >
              <Search aria-hidden className="h-4 w-4" />
              搜索
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[260px_1fr_360px] lg:px-8">
        <aside className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal aria-hidden className="h-4 w-4" />
            筛选
          </div>
          <div className="mt-4 grid gap-3 text-sm">
            {["全部", "TV", "电影", "OVA / ONA"].map((item) => (
              <button
                className="rounded-md border border-[var(--line)] px-3 py-2 text-left text-[var(--foreground)] hover:border-[var(--accent)]"
                key={item}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">当前季度番表</h2>
            <button
              className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm"
              type="button"
            >
              开播时间
            </button>
          </div>
          <div className="grid gap-3">
            {sampleSeasonAnime.map((anime) => (
              <article
                className="grid gap-3 rounded-md border border-[var(--line)] bg-[var(--panel)] p-3 shadow-sm sm:grid-cols-[72px_1fr_auto]"
                key={anime.id}
              >
                <div className="aspect-[3/4] rounded bg-[var(--accent-soft)]" />
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold">{anime.titles.zh}</h3>
                  <p className="mt-1 truncate text-sm text-[var(--muted)]">{anime.titles.ja}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-700">
                    {anime.summary}
                  </p>
                </div>
                <div className="flex items-start gap-2 text-sm sm:flex-col sm:items-end">
                  <span className="rounded bg-[var(--accent-soft)] px-2 py-1 text-[var(--accent)]">
                    {anime.type}
                  </span>
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <Star aria-hidden className="h-4 w-4" />
                    {anime.score}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-4">
          <h2 className="text-base font-semibold">详情面板</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Phase 1
            先保留面板区域。后续点击结果后，在这里展示标题、简介、角色、制作人员、关联作品和外部链接。
          </p>
        </aside>
      </section>
    </main>
  );
}
