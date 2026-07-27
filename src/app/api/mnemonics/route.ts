import { NextResponse } from "next/server";
import db from "@/lib/db";
import { generateMnemonic } from "@/lib/mnemonic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = Number(searchParams.get("userId"));
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  const mnemonics = db
    .prepare("SELECT * FROM mnemonics WHERE user_id = ? ORDER BY id DESC")
    .all(userId);
  return NextResponse.json({ mnemonics });
}

export async function POST(request: Request) {
  const body = await request.json();
  const userId = Number(body.userId);
  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  const items: string[] = Array.isArray(body.items) ? body.items : [];

  if (!userId || !topic || items.length === 0) {
    return NextResponse.json(
      { error: "userId, topic, and items are required" },
      { status: 400 }
    );
  }

  const mnemonicText = generateMnemonic(topic, items);
  const result = db
    .prepare(
      "INSERT INTO mnemonics (user_id, topic, items_json, mnemonic_text) VALUES (?, ?, ?, ?)"
    )
    .run(userId, topic, JSON.stringify(items), mnemonicText);

  const mnemonic = db
    .prepare("SELECT * FROM mnemonics WHERE id = ?")
    .get(result.lastInsertRowid);
  return NextResponse.json({ mnemonic });
}
