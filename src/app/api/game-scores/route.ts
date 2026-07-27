import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameType = searchParams.get("gameType");
  if (!gameType) {
    return NextResponse.json({ error: "gameType required" }, { status: 400 });
  }
  const scores = db
    .prepare(
      `SELECT game_scores.score, game_scores.created_at, users.username
       FROM game_scores
       JOIN users ON users.id = game_scores.user_id
       WHERE game_type = ?
       ORDER BY score DESC, game_scores.id ASC
       LIMIT 10`
    )
    .all(gameType);
  return NextResponse.json({ scores });
}

export async function POST(request: Request) {
  const body = await request.json();
  const userId = Number(body.userId);
  const gameType = typeof body.gameType === "string" ? body.gameType : "";
  const score = Number(body.score);

  if (!userId || !gameType || !Number.isFinite(score)) {
    return NextResponse.json(
      { error: "userId, gameType, and score are required" },
      { status: 400 }
    );
  }

  db.prepare(
    "INSERT INTO game_scores (user_id, game_type, score) VALUES (?, ?, ?)"
  ).run(userId, gameType, score);

  return NextResponse.json({ ok: true });
}
