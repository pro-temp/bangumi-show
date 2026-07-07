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
- Build the first UI as a refined PC desktop tool; do not spend MVP effort on mobile-specific adaptation.
- Use Radix UI headless primitives for refined interactive controls where they fit.

## Commands

- Install dependencies: `pnpm install`
- Start development server: `pnpm dev`
- Run lint: `pnpm lint`
- Run type checks: `pnpm typecheck`
- Generate Next.js local types: `pnpm typegen`
- Run unit tests: `pnpm test`
- Run end-to-end tests: `pnpm e2e`
- Build production app: `pnpm build`

## Code Organization

- App Router pages and route handlers live under `src/app`.
- Domain types and anime helpers live under `src/lib/anime`.
- Server-side orchestration, cache, and API envelopes live under `src/lib/server`.
- Sample data lives under `src/lib/sample-data` for fallback and Phase 2.5 flows.
- Bangumi source adapter, raw types, and normalizer live under `src/lib/sources/bangumi`.
- Platform-specific persistence lives under `src/lib/platform`.
- Client-side API helpers, collection hooks, and shared headless UI wrappers live under `src/lib/client`.
- Playwright tests live under `e2e`.

## Engineering Rules

- Do not call third-party anime APIs directly from UI components.
- Keep API adapters and normalizers behind server-side boundaries.
- Keep Bangumi as the first source in service orchestration; expose source links, cache time, and warnings through the API envelope.
- If Bangumi fails, return deterministic sample fallback data with a clear warning instead of leaking adapter errors into the UI.
- Do not scatter direct `localStorage` calls through business logic; use a repository abstraction.
- Keep platform capabilities behind adapters so Electron can replace browser implementations later.
- Keep sample data deterministic enough for unit and e2e tests.
- Add tests around adapters, normalizers, and core user flows as those pieces are introduced.
- Treat `next-env.d.ts` as a generated Next.js file; do not commit it.

## UX Rules

- The first screen should be useful immediately and show the current-season schedule by default.
- Keep the interface dense, scannable, and tool-like.
- Avoid marketing-page layouts.
- Optimize the MVP UI for PC desktop width with stable filter, result, and detail columns.
- Preserve search/filter context when opening and closing the detail panel.
- Use clear source and warning information when data is cached, missing, or supplemented.

## Phase Notes

- Phase 1 owns project skeleton, basic page structure, config, scripts, and test wiring.
- Phase 2 introduced the Bangumi adapter, normalized model mapping, cache boundary, source status, and fallback warnings.
- Phase 2.5 keeps sample-data flows usable while real data integration is still incomplete.
- Phase 3 introduced the PC-first query workbench, Radix controls, filtering, sorting, and detail panel.
- Phase 4 introduced local collection state, collection page, and JSON import/export.
