import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "typesafe.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS queries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        state TEXT NOT NULL,
        questions TEXT NOT NULL,
        ticker TEXT,
        model TEXT,
        response TEXT,
        input_tokens INTEGER,
        output_tokens INTEGER,
        duration_ms INTEGER,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    // Migration: add ticker column if missing (for existing DBs)
    const cols = db.prepare("PRAGMA table_info(queries)").all() as { name: string }[];
    if (!cols.some((c) => c.name === "ticker")) {
      db.exec("ALTER TABLE queries ADD COLUMN ticker TEXT");
    }
  }
  return db;
}

export interface QueryRow {
  id: number;
  state: string;
  questions: string;
  ticker: string | null;
  model: string | null;
  response: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  duration_ms: number | null;
  created_at: string;
}

export function insertQuery(data: {
  state: string;
  questions: string;
  ticker?: string;
  model?: string;
  response?: string;
  input_tokens?: number;
  output_tokens?: number;
  duration_ms?: number;
}) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO queries (state, questions, ticker, model, response, input_tokens, output_tokens, duration_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    data.state,
    data.questions,
    data.ticker ?? null,
    data.model ?? null,
    data.response ?? null,
    data.input_tokens ?? null,
    data.output_tokens ?? null,
    data.duration_ms ?? null
  );
}

export function getQueries(limit = 50): QueryRow[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM queries ORDER BY id DESC LIMIT ?")
    .all(limit) as QueryRow[];
}

export function getQuery(id: number): QueryRow | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM queries WHERE id = ?").get(id) as
    | QueryRow
    | undefined;
}
