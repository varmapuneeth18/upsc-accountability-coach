import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subject = searchParams.get("subject");
  const q = searchParams.get("q");

  let query = "SELECT * FROM explainers WHERE 1=1";
  const params: string[] = [];
  if (subject) {
    query += " AND subject = ?";
    params.push(subject);
  }
  if (q) {
    query += " AND (topic LIKE ? OR one_liner LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  query += " ORDER BY subject ASC, topic ASC";

  const explainers = db.prepare(query).all(...params);
  const subjects = db
    .prepare("SELECT DISTINCT subject FROM explainers ORDER BY subject ASC")
    .all() as { subject: string }[];
  return NextResponse.json({
    explainers,
    subjects: subjects.map((s) => s.subject),
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  const oneLiner =
    typeof body.oneLiner === "string" ? body.oneLiner.trim() : "";
  const createdBy =
    typeof body.createdBy === "string" ? body.createdBy : null;

  if (!subject || !topic || !oneLiner) {
    return NextResponse.json(
      { error: "subject, topic, and oneLiner are required" },
      { status: 400 }
    );
  }

  db.prepare(
    `INSERT INTO explainers (subject, topic, one_liner, created_by)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(subject, topic) DO UPDATE SET one_liner = excluded.one_liner`
  ).run(subject, topic, oneLiner, createdBy);

  const explainer = db
    .prepare("SELECT * FROM explainers WHERE subject = ? AND topic = ?")
    .get(subject, topic);
  return NextResponse.json({ explainer });
}
