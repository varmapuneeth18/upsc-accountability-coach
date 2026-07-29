import { Router } from "express";
import { pool } from "../db.js";
import { computeStreak } from "../lib/streak.js";
import { ah } from "../lib/asyncHandler.js";

const router = Router();

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

router.get(
  "/",
  ah(async (req, res) => {
    const userId = Number(req.query.userId);
    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }
    const today = todayStr();
    const checkinResult = await pool.query(
      "SELECT * FROM checkins WHERE user_id = $1 AND date = $2",
      [userId, today]
    );
    const streak = await computeStreak(userId);
    const weekAgo = daysAgoStr(6);
    const weeklyHoursResult = await pool.query(
      "SELECT COALESCE(SUM(study_hours), 0) as total FROM checkins WHERE user_id = $1 AND date >= $2",
      [userId, weekAgo]
    );
    res.json({
      checkin: checkinResult.rows[0] ?? null,
      streak,
      today,
      weeklyHours: Number(weeklyHoursResult.rows[0].total),
    });
  })
);

router.post(
  "/",
  ah(async (req, res) => {
    const userId = Number(req.body.userId);
    const note = typeof req.body.note === "string" ? req.body.note : null;
    const studyHours =
      typeof req.body.studyHours === "number" && !Number.isNaN(req.body.studyHours)
        ? req.body.studyHours
        : null;
    const screenshotData =
      typeof req.body.screenshotData === "string" ? req.body.screenshotData : null;
    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }
    const today = todayStr();
    const now = new Date().toISOString();
    await pool.query(
      `INSERT INTO checkins (user_id, date, ack_time, note, study_hours, screenshot_data)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, date) DO UPDATE SET
         ack_time = excluded.ack_time,
         note = COALESCE(excluded.note, checkins.note),
         study_hours = COALESCE(excluded.study_hours, checkins.study_hours),
         screenshot_data = COALESCE(excluded.screenshot_data, checkins.screenshot_data)`,
      [userId, today, now, note, studyHours, screenshotData]
    );
    const streak = await computeStreak(userId);
    res.json({ ok: true, streak });
  })
);

export default router;
