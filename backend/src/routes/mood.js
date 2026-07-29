import { Router } from "express";
import { pool } from "../db.js";
import { ah } from "../lib/asyncHandler.js";

const router = Router();

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

router.get(
  "/",
  ah(async (req, res) => {
    const userId = Number(req.query.userId);
    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }
    const entriesResult = await pool.query(
      "SELECT * FROM mood_checkins WHERE user_id = $1 ORDER BY date DESC LIMIT 30",
      [userId]
    );
    const today = todayStr();
    const todayResult = await pool.query(
      "SELECT * FROM mood_checkins WHERE user_id = $1 AND date = $2",
      [userId, today]
    );
    res.json({
      entries: entriesResult.rows,
      todayEntry: todayResult.rows[0] ?? null,
    });
  })
);

router.post(
  "/",
  ah(async (req, res) => {
    const userId = Number(req.body.userId);
    const mood = Number(req.body.mood);
    const note = typeof req.body.note === "string" ? req.body.note : null;

    if (!userId || !Number.isInteger(mood) || mood < 1 || mood > 5) {
      return res
        .status(400)
        .json({ error: "userId and mood (1-5) are required" });
    }

    const today = todayStr();
    await pool.query(
      `INSERT INTO mood_checkins (user_id, date, mood, note)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, date) DO UPDATE SET mood = excluded.mood, note = excluded.note`,
      [userId, today, mood, note]
    );

    const result = await pool.query(
      "SELECT * FROM mood_checkins WHERE user_id = $1 AND date = $2",
      [userId, today]
    );
    res.json({ entry: result.rows[0] });
  })
);

export default router;
