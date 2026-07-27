import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = Number(searchParams.get("userId"));
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  const entries = db
    .prepare(
      "SELECT * FROM journal_entries WHERE user_id = ? ORDER BY id DESC"
    )
    .all(userId);
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const body = await request.json();
  const userId = Number(body.userId);
  const entryText =
    typeof body.entryText === "string" ? body.entryText.trim() : "";

  if (!userId || !entryText) {
    return NextResponse.json(
      { error: "userId and entryText are required" },
      { status: 400 }
    );
  }

  const result = db
    .prepare("INSERT INTO journal_entries (user_id, entry_text) VALUES (?, ?)")
    .run(userId, entryText);

  const entry = db
    .prepare("SELECT * FROM journal_entries WHERE id = ?")
    .get(result.lastInsertRowid);
  return NextResponse.json({ entry });
}
