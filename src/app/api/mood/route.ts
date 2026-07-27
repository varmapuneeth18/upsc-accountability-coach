import { NextResponse } from "next/server";
import db from "@/lib/db";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = Number(searchParams.get("userId"));
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  const entries = db
    .prepare(
      "SELECT * FROM mood_checkins WHERE user_id = ? ORDER BY date DESC LIMIT 30"
    )
    .all(userId);
  const today = todayStr();
  const todayEntry = db
    .prepare("SELECT * FROM mood_checkins WHERE user_id = ? AND date = ?")
    .get(userId, today);
  return NextResponse.json({ entries, todayEntry: todayEntry ?? null });
}

export async function POST(request: Request) {
  const body = await request.json();
  const userId = Number(body.userId);
  const mood = Number(body.mood);
  const note = typeof body.note === "string" ? body.note : null;

  if (!userId || !Number.isInteger(mood) || mood < 1 || mood > 5) {
    return NextResponse.json(
      { error: "userId and mood (1-5) are required" },
      { status: 400 }
    );
  }

  const today = todayStr();
  db.prepare(
    `INSERT INTO mood_checkins (user_id, date, mood, note)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, date) DO UPDATE SET mood = excluded.mood, note = excluded.note`
  ).run(userId, today, mood, note);

  const entry = db
    .prepare("SELECT * FROM mood_checkins WHERE user_id = ? AND date = ?")
    .get(userId, today);
  return NextResponse.json({ entry });
}
