import { NextResponse } from "next/server";
import { getQueries } from "@/lib/db";

export async function GET() {
  const queries = getQueries(50);
  return NextResponse.json(queries);
}
