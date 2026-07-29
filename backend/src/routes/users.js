import { Router } from "express";
import { pool, getOrCreateUser } from "../db.js";
import { ah } from "../lib/asyncHandler.js";

const router = Router();

router.get(
  "/",
  ah(async (_req, res) => {
    const result = await pool.query(
      "SELECT id, username FROM users ORDER BY username"
    );
    res.json({ users: result.rows });
  })
);

router.post(
  "/",
  ah(async (req, res) => {
    const username =
      typeof req.body.username === "string" ? req.body.username : "";
    try {
      const user = await getOrCreateUser(username);
      res.json({ user });
    } catch {
      res.status(400).json({ error: "Username required" });
    }
  })
);

export default router;
