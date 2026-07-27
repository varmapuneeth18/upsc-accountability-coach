import { NextResponse } from "next/server";
import db, { getOrCreateUser } from "@/lib/db";

export async function GET() {
  const users = db
    .prepare("SELECT id, username FROM users ORDER BY username")
    .all();
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const body = await request.json();
  const username = typeof body.username === "string" ? body.username : "";
  try {
    const user = getOrCreateUser(username);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }
}
