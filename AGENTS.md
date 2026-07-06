# AGENTS.md

## Project

Bangumi Show is a local-first anime lookup app for Chinese users. The MVP focuses on Japanese animation only: current-season schedule, keyword search, filtering/sorting, detail panel, recent searches, and local collection status.

## Current Decisions

- Use `pnpm` for all frontend package management.
- Build the MVP as a Next.js + TypeScript + React + Tailwind CSS web app.
- Keep Bangumi as the primary data source; use AniList only to supplement missing fields.
- Prefer a detail panel over a standalone detail route for the MVP.
- Treat the current-season schedule as a core homepage entry point.
- Keep collection data local and limited to status markers.
- Preserve an Electron path by isolating platform APIs, persistence, file access, logs, and cache behavior.

## Commands

- Install dependencies: `pnpm install`
- Start development server: `pnpm dev`
- Run lint: `pnpm lint`
- Run type checks: `pnpm typecheck`
- Run unit tests: `pnpm test`
- Run end-to-end tests: `pnpm e2e`
- Build production app: `pnpm build`

## Code Organization

- App Router pages and route handlers live under `src/app`.
- Domain types and anime helpers live under `src/lib/anime`.
- Server-side orchestration lives under `src/lib/server`.
- Sample data lives under `src/lib/sample-data` until real adapters are implemented.
- Platform-specific persistence lives under `src/lib/platform`.
- Playwright tests live under `e2e`.

## Engineering Rules

- Do not call third-party anime APIs directly from UI components.
- Keep API adapters and normalizers behind server-side boundaries.
- Do not scatter direct `localStorage` calls through business logic; use a repository abstraction.
- Keep platform capabilities behind adapters so Electron can replace browser implementations later.
- Keep sample data deterministic enough for unit and e2e tests.
- Add tests around adapters, normalizers, and core user flows as those pieces are introduced.

## UX Rules

- The first screen should be useful immediately and show the current-season schedule by default.
- Keep the interface dense, scannable, and tool-like.
- Avoid marketing-page layouts.
- Preserve search/filter context when opening and closing the detail panel.
- Use clear source and warning information when data is cached, missing, or supplemented.

## Phase Notes

- Phase 1 owns project skeleton, basic page structure, config, scripts, and test wiring.
- Phase 2 should introduce the Bangumi adapter, normalized model mapping, cache boundary, and source warnings.
- Phase 2.5 should keep sample-data flows usable while real data integration is still incomplete.
