<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# TypeSafe Playground — Agent Rules

## Project overview

Web playground for evaluating text against structured questions via the [TypeSafe AI](https://typesafe.ai) API. Two modes:

- **Playground** (`/`) — arbitrary state text + dynamic custom questions
- **Stock Signal Analyzer** (`/analyze`) — financial news with preset sentiment/materiality/urgency/sector/action questions

Results persist to local SQLite (`typesafe.db`). See `README.md` and `SAMPLE-QUERIES.md` for usage examples.

## Stack

- **Next.js 16** (App Router) — not Next.js 14/15; check `node_modules/next/dist/docs/` before assuming APIs
- **React 19**, **TypeScript 5**, **Tailwind CSS 4**
- **@typesafe-ai/sdk** (`TypeSafeClient`, `noul`, `choice`, `score`)
- **better-sqlite3** for local persistence via `src/lib/db.ts`
- **pnpm** — package manager (`pnpm@12.3.4`)

## Environment

- `TYPESAFE_API_KEY` in `.env.local` (never commit `.env*`)
- `TypeSafeClient` reads the key automatically; do not hardcode secrets

## Architecture

```
src/
  app/
    page.tsx              # Playground (client component)
    analyze/page.tsx      # Stock analyzer (client component)
    api/
      evaluate/route.ts   # POST — custom state + questions
      history/route.ts    # GET — last 50 queries
      analyze/route.ts    # POST — preset stock analysis
      analyze/history/route.ts
  lib/
    db.ts                 # SQLite singleton, insertQuery, getQueries
```

- **API routes** call TypeSafe, persist via `insertQuery`, return JSON with `model`, `answers`, `usage`, `duration_ms`
- **Pages** are `"use client"` for interactive forms; fetch API routes from the browser
- **Database** logic stays in `src/lib/db.ts` — do not scatter raw SQL elsewhere

## TypeSafe question types

| Type | SDK helper | Returns |
|------|------------|---------|
| `noul` | `noul(instructions)` | 0.0–1.0 probability (yes/no) |
| `choice` | `choice(instructions, { key: desc, ... })` | Category + confidence + per-class probabilities |
| `score` | `score(instructions, [legend, ...])` | Ordinal score + legend + probabilities (≥2 criteria) |

Use `client.systemOne({ state, questions, model? })` for all evaluations. Question keys become answer keys in the response.

## Conventions

1. **Build must pass** — run `pnpm run build` before finishing; fix all TypeScript and lint errors
2. **Minimal scope** — match existing patterns; no unrelated refactors or new abstractions for one-off logic
3. **Error handling** — API routes return `{ error: message }` with appropriate status (400 for validation, 500 for TypeSafe failures); include `duration_ms` on errors when timing was started
4. **Persistence** — store `state`, `questions` (JSON string), `model`, `response` (full JSON), token counts, and `duration_ms`; use `ticker` column for stock analyses
5. **History** — default limit 50, ordered by `id DESC`
6. **Styling** — Tailwind utility classes; dark theme with zinc palette; Geist fonts from layout
7. **No commits unless asked** — do not commit `typesafe.db`, `*.db-shm`, `*.db-wal`, or `.env*` (already gitignored)
8. **Schema migrations** — add columns via PRAGMA check + `ALTER TABLE` pattern in `getDb()`, not separate migration files

## Adding features

- **New API endpoint** → `src/app/api/<name>/route.ts`, use `NextResponse.json`, call `insertQuery` if results should persist
- **New page** → `src/app/<name>/page.tsx`, add nav link in existing pages' headers
- **New question preset** → add to `PRESETS` on playground page or hardcode in analyze route following existing `choice`/`noul`/`score` patterns
- **DB changes** → extend `QueryRow`, `insertQuery`, and migration block in `db.ts`

## Do not

- Commit API keys, `.env.local`, or SQLite database files
- Use Supabase, Prisma, or other DB layers — this project uses better-sqlite3 directly
- Assume Next.js 14/15 APIs (`pages/`, `getServerSideProps`, etc.) — App Router only
- Add tests unless explicitly requested
- Over-engineer shared components — pages currently inline their UI
