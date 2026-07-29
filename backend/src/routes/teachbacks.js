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
      "SELECT * FROM teachbacks WHERE user_id = $1 ORDER BY id DESC",
      [userId]
    );
    res.json({ teachbacks: result.rows });
  })
);

router.post(
  "/",
  ah(async (req, res) => {
    const userId = Number(req.body.userId);
    const topic = typeof req.body.topic === "string" ? req.body.topic.trim() : "";
    const explanation =
      typeof req.body.explanation === "string" ? req.body.explanation.trim() : "";

    if (!userId || !topic || !explanation) {
      return res
        .status(400)
        .json({ error: "userId, topic, and explanation are required" });
    }

    const result = await pool.query(
      "INSERT INTO teachbacks (user_id, topic, explanation) VALUES ($1, $2, $3) RETURNING *",
      [userId, topic, explanation]
    );
    res.json({ teachback: result.rows[0] });
  })
);

export default router;
