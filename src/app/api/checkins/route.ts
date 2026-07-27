import { NextResponse } from "next/server";
import db from "@/lib/db";
import { computeStreak } from "@/lib/streak";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = Number(searchParams.get("userId"));
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  const today = todayStr();
  const checkin = db
    .prepare("SELECT * FROM checkins WHERE user_id = ? AND date = ?")
    .get(userId, today);
  const streak = computeStreak(userId);
  const weekAgo = daysAgoStr(6);
  const weeklyHours = (
    db
      .prepare(
        "SELECT COALESCE(SUM(study_hours), 0) as total FROM checkins WHERE user_id = ? AND date >= ?"
      )
      .get(userId, weekAgo) as { total: number }
  ).total;
  return NextResponse.json({ checkin: checkin ?? null, streak, today, weeklyHours });
}

export async function POST(request: Request) {
  const body = await request.json();
  const userId = Number(body.userId);
  const note = typeof body.note === "string" ? body.note : null;
  const studyHours =
    typeof body.studyHours === "number" && !Number.isNaN(body.studyHours)
      ? body.studyHours
      : null;
  const screenshotData =
    typeof body.screenshotData === "string" ? body.screenshotData : null;
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  const today = todayStr();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO checkins (user_id, date, ack_time, note, study_hours, screenshot_data)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, date) DO UPDATE SET
       ack_time = excluded.ack_time,
       note = COALESCE(excluded.note, note),
       study_hours = COALESCE(excluded.study_hours, study_hours),
       screenshot_data = COALESCE(excluded.screenshot_data, screenshot_data)`
  ).run(userId, today, now, note, studyHours, screenshotData);
  const streak = computeStreak(userId);
  return NextResponse.json({ ok: true, streak });
}
