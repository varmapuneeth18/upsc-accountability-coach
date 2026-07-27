import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = Number(searchParams.get("userId"));
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  const teachbacks = db
    .prepare("SELECT * FROM teachbacks WHERE user_id = ? ORDER BY id DESC")
    .all(userId);
  return NextResponse.json({ teachbacks });
}

export async function POST(request: Request) {
  const body = await request.json();
  const userId = Number(body.userId);
  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  const explanation =
    typeof body.explanation === "string" ? body.explanation.trim() : "";

  if (!userId || !topic || !explanation) {
    return NextResponse.json(
      { error: "userId, topic, and explanation are required" },
      { status: 400 }
    );
  }

  const result = db
    .prepare(
      "INSERT INTO teachbacks (user_id, topic, explanation) VALUES (?, ?, ?)"
    )
    .run(userId, topic, explanation);

  const teachback = db
    .prepare("SELECT * FROM teachbacks WHERE id = ?")
    .get(result.lastInsertRowid);
  return NextResponse.json({ teachback });
}
