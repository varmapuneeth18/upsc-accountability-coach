import express from "express";
import cors from "cors";
import { initSchema } from "./db.js";

import usersRouter from "./routes/users.js";
import checkinsRouter from "./routes/checkins.js";
import targetsRouter from "./routes/targets.js";
import leaderboardRouter from "./routes/leaderboard.js";
import mnemonicsRouter from "./routes/mnemonics.js";
import teachbacksRouter from "./routes/teachbacks.js";
import explainersRouter from "./routes/explainers.js";
import swotRouter from "./routes/swot.js";
import moodRouter from "./routes/mood.js";
import journalRouter from "./routes/journal.js";
import gameScoresRouter from "./routes/gameScores.js";

const app = express();

// Comma-separated list of allowed frontend origins, e.g.
// "http://localhost:3000,https://your-app.vercel.app"
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Vercel gives every deployment (production, branch, and preview) its own
// unique-hash subdomain, so an exact-match allowlist can't keep up. Any
// *.vercel.app origin is allowed on top of the explicit list below, which
// still covers localhost and any custom domain you point at this project.
const VERCEL_PREVIEW_ORIGIN = /^https:\/\/[a-z0-9-]+\.vercel\.app$/;

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (no Origin header, e.g. curl/health checks).
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        VERCEL_PREVIEW_ORIGIN.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed`));
      }
    },
  })
);

// Screenshot proof is uploaded as a base64 data URL, well over Express's
// default 100kb JSON body limit.
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/users", usersRouter);
app.use("/api/checkins", checkinsRouter);
app.use("/api/targets", targetsRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/mnemonics", mnemonicsRouter);
app.use("/api/teachbacks", teachbacksRouter);
app.use("/api/explainers", explainersRouter);
app.use("/api/swot", swotRouter);
app.use("/api/mood", moodRouter);
app.use("/api/journal", journalRouter);
app.use("/api/game-scores", gameScoresRouter);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message ?? "Internal error" });
});

const port = process.env.PORT ?? 4000;

async function main() {
  await initSchema();
  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
