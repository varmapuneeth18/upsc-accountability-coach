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
    const period = req.query.period;
    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }
    let query = "SELECT * FROM targets WHERE user_id = $1";
    const params = [userId];
    if (period) {
      query += " AND period = $2";
      params.push(period);
    }
    query += " ORDER BY due_date ASC, id ASC";
    const result = await pool.query(query, params);
    res.json({ targets: result.rows });
  })
);

router.post(
  "/",
  ah(async (req, res) => {
    const userId = Number(req.body.userId);
    const period = req.body.period;
    const title =
      typeof req.body.title === "string" ? req.body.title.trim() : "";
    const dueDate =
      typeof req.body.dueDate === "string" && req.body.dueDate
        ? req.body.dueDate
        : todayStr();
    const quizQuestion =
      typeof req.body.quizQuestion === "string" ? req.body.quizQuestion : null;
    const quizAnswer =
      typeof req.body.quizAnswer === "string" ? req.body.quizAnswer : null;
    const stakeAmount =
      typeof req.body.stakeAmount === "number" && req.body.stakeAmount > 0
        ? req.body.stakeAmount
        : null;

    if (!userId || !title || !["daily", "weekly", "monthly"].includes(period)) {
      return res
        .status(400)
        .json({ error: "userId, valid period, and title are required" });
    }

    const result = await pool.query(
      `INSERT INTO targets (user_id, period, title, due_date, quiz_question, quiz_answer, stake_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, period, title, dueDate, quizQuestion, quizAnswer, stakeAmount]
    );
    res.json({ target: result.rows[0] });
  })
);

router.patch(
  "/:id",
  ah(async (req, res) => {
    const targetId = Number(req.params.id);
    const existing = await pool.query("SELECT * FROM targets WHERE id = $1", [
      targetId,
    ]);
    if (!existing.rows[0]) {
      return res.status(404).json({ error: "Not found" });
    }

    const status =
      req.body.status === "done"
        ? "done"
        : req.body.status === "pending"
        ? "pending"
        : null;
    const proofNote =
      typeof req.body.proofNote === "string" ? req.body.proofNote : undefined;
    const quizCorrect =
      typeof req.body.quizCorrect === "boolean"
        ? req.body.quizCorrect
          ? 1
          : 0
        : undefined;
    const stakeSettled = req.body.stakeSettled === true ? 1 : undefined;

    if (status) {
      const completedAt = status === "done" ? new Date().toISOString() : null;
      await pool.query(
        "UPDATE targets SET status = $1, proof_note = COALESCE($2, proof_note), completed_at = $3 WHERE id = $4",
        [status, proofNote ?? null, completedAt, targetId]
      );
    } else if (proofNote !== undefined) {
      await pool.query("UPDATE targets SET proof_note = $1 WHERE id = $2", [
        proofNote,
        targetId,
      ]);
    }

    if (quizCorrect !== undefined) {
      await pool.query("UPDATE targets SET quiz_correct = $1 WHERE id = $2", [
        quizCorrect,
        targetId,
      ]);
    }

    if (stakeSettled !== undefined) {
      await pool.query("UPDATE targets SET stake_settled = 1 WHERE id = $1", [
        targetId,
      ]);
    }

    const target = await pool.query("SELECT * FROM targets WHERE id = $1", [
      targetId,
    ]);
    res.json({ target: target.rows[0] });
  })
);

router.delete(
  "/:id",
  ah(async (req, res) => {
    await pool.query("DELETE FROM targets WHERE id = $1", [
      Number(req.params.id),
    ]);
    res.json({ ok: true });
  })
);

export default router;
