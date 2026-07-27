import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const targetId = Number(id);
  const body = await request.json();

  const existing = db
    .prepare("SELECT * FROM targets WHERE id = ?")
    .get(targetId);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const status = body.status === "done" ? "done" : body.status === "pending" ? "pending" : null;
  const proofNote = typeof body.proofNote === "string" ? body.proofNote : undefined;
  const quizCorrect =
    typeof body.quizCorrect === "boolean" ? (body.quizCorrect ? 1 : 0) : undefined;
  const stakeSettled = body.stakeSettled === true ? 1 : undefined;

  if (status) {
    const completedAt = status === "done" ? new Date().toISOString() : null;
    db.prepare(
      "UPDATE targets SET status = ?, proof_note = COALESCE(?, proof_note), completed_at = ? WHERE id = ?"
    ).run(status, proofNote ?? null, completedAt, targetId);
  } else if (proofNote !== undefined) {
    db.prepare("UPDATE targets SET proof_note = ? WHERE id = ?").run(
      proofNote,
      targetId
    );
  }

  if (quizCorrect !== undefined) {
    db.prepare("UPDATE targets SET quiz_correct = ? WHERE id = ?").run(
      quizCorrect,
      targetId
    );
  }

  if (stakeSettled !== undefined) {
    db.prepare("UPDATE targets SET stake_settled = 1 WHERE id = ?").run(
      targetId
    );
  }

  const target = db.prepare("SELECT * FROM targets WHERE id = ?").get(targetId);
  return NextResponse.json({ target });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.prepare("DELETE FROM targets WHERE id = ?").run(Number(id));
  return NextResponse.json({ ok: true });
}
