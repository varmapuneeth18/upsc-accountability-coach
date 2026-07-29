import { Router } from "express";
import { pool } from "../db.js";
import { ah } from "../lib/asyncHandler.js";

const router = Router();

router.get(
  "/",
  ah(async (req, res) => {
    const userId = Number(req.query.userId);
    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }
    const result = await pool.query(
      "SELECT * FROM swot_entries WHERE user_id = $1 ORDER BY id DESC",
      [userId]
    );
    res.json({ entries: result.rows });
  })
);

router.post(
  "/",
  ah(async (req, res) => {
    const userId = Number(req.body.userId);
    const periodLabel =
      typeof req.body.periodLabel === "string" ? req.body.periodLabel.trim() : "";
    const strengths =
      typeof req.body.strengths === "string" ? req.body.strengths : "";
    const weaknesses =
      typeof req.body.weaknesses === "string" ? req.body.weaknesses : "";
    const opportunities =
      typeof req.body.opportunities === "string" ? req.body.opportunities : "";
    const threats = typeof req.body.threats === "string" ? req.body.threats : "";
    const actionPlan =
      typeof req.body.actionPlan === "string" ? req.body.actionPlan : "";

    if (!userId || !periodLabel) {
      return res
        .status(400)
        .json({ error: "userId and periodLabel are required" });
    }

    const result = await pool.query(
      `INSERT INTO swot_entries (user_id, period_label, strengths, weaknesses, opportunities, threats, action_plan)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, periodLabel, strengths, weaknesses, opportunities, threats, actionPlan]
    );
    res.json({ entry: result.rows[0] });
  })
);

export default router;
