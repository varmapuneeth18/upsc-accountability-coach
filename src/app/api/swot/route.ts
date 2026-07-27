import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = Number(searchParams.get("userId"));
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  const entries = db
    .prepare("SELECT * FROM swot_entries WHERE user_id = ? ORDER BY id DESC")
    .all(userId);
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const body = await request.json();
  const userId = Number(body.userId);
  const periodLabel =
    typeof body.periodLabel === "string" ? body.periodLabel.trim() : "";
  const strengths = typeof body.strengths === "string" ? body.strengths : "";
  const weaknesses =
    typeof body.weaknesses === "string" ? body.weaknesses : "";
  const opportunities =
    typeof body.opportunities === "string" ? body.opportunities : "";
  const threats = typeof body.threats === "string" ? body.threats : "";
  const actionPlan =
    typeof body.actionPlan === "string" ? body.actionPlan : "";

  if (!userId || !periodLabel) {
    return NextResponse.json(
      { error: "userId and periodLabel are required" },
      { status: 400 }
    );
  }

  const result = db
    .prepare(
      `INSERT INTO swot_entries (user_id, period_label, strengths, weaknesses, opportunities, threats, action_plan)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      userId,
      periodLabel,
      strengths,
      weaknesses,
      opportunities,
      threats,
      actionPlan
    );

  const entry = db
    .prepare("SELECT * FROM swot_entries WHERE id = ?")
    .get(result.lastInsertRowid);
  return NextResponse.json({ entry });
}
