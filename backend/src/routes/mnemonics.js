import { Router } from "express";
import { pool } from "../db.js";
import { generateMnemonic } from "../lib/mnemonic.js";
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
      "SELECT * FROM mnemonics WHERE user_id = $1 ORDER BY id DESC",
      [userId]
    );
    res.json({ mnemonics: result.rows });
  })
);

router.post(
  "/",
  ah(async (req, res) => {
    const userId = Number(req.body.userId);
    const topic = typeof req.body.topic === "string" ? req.body.topic.trim() : "";
    const items = Array.isArray(req.body.items) ? req.body.items : [];

    if (!userId || !topic || items.length === 0) {
      return res
        .status(400)
        .json({ error: "userId, topic, and items are required" });
    }

    const mnemonicText = generateMnemonic(topic, items);
    const result = await pool.query(
      "INSERT INTO mnemonics (user_id, topic, items_json, mnemonic_text) VALUES ($1, $2, $3, $4) RETURNING *",
      [userId, topic, JSON.stringify(items), mnemonicText]
    );
    res.json({ mnemonic: result.rows[0] });
  })
);

export default router;
