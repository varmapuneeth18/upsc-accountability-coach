import { Router } from "express";
import { pool } from "../db.js";
import { ah } from "../lib/asyncHandler.js";

const router = Router();

router.get(
  "/",
  ah(async (req, res) => {
    const gameType = req.query.gameType;
    if (!gameType) {
      return res.status(400).json({ error: "gameType required" });
    }
    const result = await pool.query(
      `SELECT game_scores.score, game_scores.created_at, users.username
       FROM game_scores
       JOIN users ON users.id = game_scores.user_id
       WHERE game_type = $1
       ORDER BY score DESC, game_scores.id ASC
       LIMIT 10`,
      [gameType]
    );
    res.json({ scores: result.rows });
  })
);

router.post(
  "/",
  ah(async (req, res) => {
    const userId = Number(req.body.userId);
    const gameType =
      typeof req.body.gameType === "string" ? req.body.gameType : "";
    const score = Number(req.body.score);

    if (!userId || !gameType || !Number.isFinite(score)) {
      return res
        .status(400)
        .json({ error: "userId, gameType, and score are required" });
    }

    await pool.query(
      "INSERT INTO game_scores (user_id, game_type, score) VALUES ($1, $2, $3)",
      [userId, gameType, score]
    );

    res.json({ ok: true });
  })
);

export default router;
