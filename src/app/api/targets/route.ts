import { NextResponse } from "next/server";
import db from "@/lib/db";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = Number(searchParams.get("userId"));
  const period = searchParams.get("period");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  let query = "SELECT * FROM targets WHERE user_id = ?";
  const params: (string | number)[] = [userId];
  if (period) {
    query += " AND period = ?";
    params.push(period);
  }
  query += " ORDER BY due_date ASC, id ASC";
  const targets = db.prepare(query).all(...params);
  return NextResponse.json({ targets });
}

export async function POST(request: Request) {
  const body = await request.json();
  const userId = Number(body.userId);
  const period = body.period;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const dueDate =
    typeof body.dueDate === "string" && body.dueDate ? body.dueDate : todayStr();
  const quizQuestion =
    typeof body.quizQuestion === "string" ? body.quizQuestion : null;
  const quizAnswer =
    typeof body.quizAnswer === "string" ? body.quizAnswer : null;
  const stakeAmount =
    typeof body.stakeAmount === "number" && body.stakeAmount > 0
      ? body.stakeAmount
      : null;

  if (!userId || !title || !["daily", "weekly", "monthly"].includes(period)) {
    return NextResponse.json(
      { error: "userId, valid period, and title are required" },
      { status: 400 }
    );
  }

  const result = db
    .prepare(
      `INSERT INTO targets (user_id, period, title, due_date, quiz_question, quiz_answer, stake_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(userId, period, title, dueDate, quizQuestion, quizAnswer, stakeAmount);

  const target = db
    .prepare("SELECT * FROM targets WHERE id = ?")
    .get(result.lastInsertRowid);
  return NextResponse.json({ target });
}
