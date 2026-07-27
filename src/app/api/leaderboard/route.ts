import { NextResponse } from "next/server";
import db from "@/lib/db";
import { computeStreak } from "@/lib/streak";

export async function GET() {
  const users = db
    .prepare("SELECT id, username FROM users")
    .all() as { id: number; username: string }[];

  const rows = users.map((user) => {
    const streak = computeStreak(user.id);
    const completedCount = (
      db
        .prepare(
          "SELECT COUNT(*) as c FROM targets WHERE user_id = ? AND status = 'done'"
        )
        .get(user.id) as { c: number }
    ).c;

    const badges: string[] = [];
    if (streak.longest >= 7) badges.push("7-Day Streak");
    if (streak.longest >= 30) badges.push("30-Day Streak");
    if (completedCount >= 10) badges.push("10 Targets Hit");
    if (completedCount >= 50) badges.push("50 Targets Hit");

    return {
      userId: user.id,
      username: user.username,
      currentStreak: streak.current,
      longestStreak: streak.longest,
      completedCount,
      badges,
    };
  });

  rows.sort(
    (a, b) =>
      b.currentStreak - a.currentStreak || b.completedCount - a.completedCount
  );

  return NextResponse.json({ leaderboard: rows });
}
