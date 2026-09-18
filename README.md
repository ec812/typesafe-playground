# TypeSafe Playground

A web app for evaluating text against structured questions using the [TypeSafe AI](https://typesafe.ai) API. Built with Next.js 16, TypeScript, and Tailwind CSS.

## What it does

TypeSafe lets you define questions with typed answer formats — yes/no (`noul`), categorical (`choice`), or ordinal (`score`) — and get structured, scored results from an LLM in a single API call. This playground gives you a UI to experiment with those capabilities.

Two modes:

- **Playground** (`/`) — define any state text and build custom questions dynamically. Good for testing TypeSafe on arbitrary use cases.
- **Stock Signal Analyzer** (`/analyze`) — paste financial news or earnings reports and get sentiment, materiality, urgency, sector impact, and suggested action in one call. Includes ticker presets for HK and US stocks.

Results are persisted to a local SQLite database so you can browse and restore previous evaluations.

## Question types

| Type | What it returns | Example |
|------|----------------|---------|
| **noul** | 0.0–1.0 probability (yes/no) | "This text is urgent" → 0.87 |
| **choice** | Category label + confidence + per-class probabilities | Sentiment → "bearish" (72%) |
| **score** | Ordinal score + legend + probabilities | Urgency → 2.4 ("High — needs attention") |

## Setup

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- A TypeSafe API key

### Install

```bash
pnpm install
```

### Environment

Create `.env.local` in the project root:

```
TYPESAFE_API_KEY=your-api-key-here
```

### Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## API routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/evaluate` | Evaluate arbitrary state + questions |
| GET | `/api/history` | Last 50 queries (all types) |
| POST | `/api/analyze` | Analyze financial news with preset questions |
| GET | `/api/analyze/history` | Last 50 stock analyses |

## Stack

- [Next.js](https://nextjs.org) 16 (App Router)
- [TypeSafe AI SDK](https://www.npmjs.com/package/@typesafe-ai/sdk) 0.6
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) for local persistence
- [Tailwind CSS](https://tailwindcss.com) 4

## Sample queries

See [SAMPLE-QUERIES.md](./SAMPLE-QUERIES.md) for 10 ready-to-use evaluation examples covering stock signals, sentiment analysis, spam detection, contract review, and more.

## License

Open source under the MIT License.
