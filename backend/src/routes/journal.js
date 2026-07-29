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
      "SELECT * FROM journal_entries WHERE user_id = $1 ORDER BY id DESC",
      [userId]
    );
    res.json({ entries: result.rows });
  })
);

router.post(
  "/",
  ah(async (req, res) => {
    const userId = Number(req.body.userId);
    const entryText =
      typeof req.body.entryText === "string" ? req.body.entryText.trim() : "";

    if (!userId || !entryText) {
      return res
        .status(400)
        .json({ error: "userId and entryText are required" });
    }

    const result = await pool.query(
      "INSERT INTO journal_entries (user_id, entry_text) VALUES ($1, $2) RETURNING *",
      [userId, entryText]
    );
    res.json({ entry: result.rows[0] });
  })
);

export default router;
