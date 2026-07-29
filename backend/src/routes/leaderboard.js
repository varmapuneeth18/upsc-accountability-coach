import { Router } from "express";
import { pool } from "../db.js";
import { computeStreak } from "../lib/streak.js";
import { ah } from "../lib/asyncHandler.js";

const router = Router();

router.get(
  "/",
  ah(async (_req, res) => {
    const usersResult = await pool.query("SELECT id, username FROM users");

    const rows = [];
    for (const user of usersResult.rows) {
      const streak = await computeStreak(user.id);
      const completedResult = await pool.query(
        "SELECT COUNT(*) as c FROM targets WHERE user_id = $1 AND status = 'done'",
        [user.id]
      );
      const completedCount = Number(completedResult.rows[0].c);

      const badges = [];
      if (streak.longest >= 7) badges.push("7-Day Streak");
      if (streak.longest >= 30) badges.push("30-Day Streak");
      if (completedCount >= 10) badges.push("10 Targets Hit");
      if (completedCount >= 50) badges.push("50 Targets Hit");

      rows.push({
        userId: user.id,
        username: user.username,
        currentStreak: streak.current,
        longestStreak: streak.longest,
        completedCount,
        badges,
      });
    }

    rows.sort(
      (a, b) =>
        b.currentStreak - a.currentStreak || b.completedCount - a.completedCount
    );

    res.json({ leaderboard: rows });
  })
);

export default router;
