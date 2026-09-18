# Changelog

## 2026-09-17

- Added Stock Signal Analyzer page at /analyze — 5-dimension TypeSafe evaluation (sentiment, materiality, urgency, sector, suggested action)
- Added ticker presets (AAPL, NVDA, TSLA, 0700.HK, 9988.HK) with custom ticker input
- Added SQLite ticker column with auto-migration for existing DBs
- Added /api/analyze and /api/analyze/history endpoints
- Added signal summary bar combining all answers into one line
- Added nav links between Playground and Analyzer pages
- Added load sample button with TSLA test case

- Initial scaffold: Next.js 16 + TypeScript + Tailwind CSS project at ~/projects/typesafe/
- Integrated `@typesafe-ai/sdk` (v0.6.0) with `TypeSafeClient` for API calls
- Added `better-sqlite3` for local query history persistence
- Built `/api/evaluate` POST endpoint — accepts state + questions, calls TypeSafe, stores results
- Built `/api/history` GET endpoint — returns last 50 queries from SQLite
- Created interactive playground page with:
  - Dynamic question builder (noul/choice/score types)
  - Preset templates (Support Ticket, Sentiment Analysis, Product Review)
  - Live results with confidence bars and probability breakdowns
  - History sidebar with click-to-restore previous queries
  - Raw JSON viewer
- Environment: `.env.local` configured with `TYPESAFE_API_KEY` from ~/.hermes/.env
