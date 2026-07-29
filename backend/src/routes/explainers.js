import { Router } from "express";
import { pool } from "../db.js";
import { ah } from "../lib/asyncHandler.js";

const router = Router();

router.get(
  "/",
  ah(async (req, res) => {
    const subject = req.query.subject;
    const q = req.query.q;

    let query = "SELECT * FROM explainers WHERE 1=1";
    const params = [];
    if (subject) {
      params.push(subject);
      query += ` AND subject = $${params.length}`;
    }
    if (q) {
      params.push(`%${q}%`);
      query += ` AND (topic ILIKE $${params.length} OR one_liner ILIKE $${params.length})`;
    }
    query += " ORDER BY subject ASC, topic ASC";

    const result = await pool.query(query, params);
    const subjectsResult = await pool.query(
      "SELECT DISTINCT subject FROM explainers ORDER BY subject ASC"
    );
    res.json({
      explainers: result.rows,
      subjects: subjectsResult.rows.map((s) => s.subject),
    });
  })
);

router.post(
  "/",
  ah(async (req, res) => {
    const subject =
      typeof req.body.subject === "string" ? req.body.subject.trim() : "";
    const topic = typeof req.body.topic === "string" ? req.body.topic.trim() : "";
    const oneLiner =
      typeof req.body.oneLiner === "string" ? req.body.oneLiner.trim() : "";
    const createdBy =
      typeof req.body.createdBy === "string" ? req.body.createdBy : null;

    if (!subject || !topic || !oneLiner) {
      return res
        .status(400)
        .json({ error: "subject, topic, and oneLiner are required" });
    }

    await pool.query(
      `INSERT INTO explainers (subject, topic, one_liner, created_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (subject, topic) DO UPDATE SET one_liner = excluded.one_liner`,
      [subject, topic, oneLiner, createdBy]
    );

    const result = await pool.query(
      "SELECT * FROM explainers WHERE subject = $1 AND topic = $2",
      [subject, topic]
    );
    res.json({ explainer: result.rows[0] });
  })
);

export default router;
