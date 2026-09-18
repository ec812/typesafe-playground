import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const queries = db
    .prepare("SELECT * FROM queries WHERE ticker IS NOT NULL ORDER BY id DESC LIMIT 50")
    .all();
  return NextResponse.json(queries);
}
