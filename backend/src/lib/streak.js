import { pool } from "../db.js";

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

/**
 * A day "counts" toward the streak if the user checked in (woke up / acked
 * the schedule) AND every daily target due that day is marked done.
 * Days with no daily targets due still count as long as the check-in happened.
 */
export async function computeStreak(userId) {
  const checkinsResult = await pool.query(
    "SELECT date FROM checkins WHERE user_id = $1",
    [userId]
  );
  const checkinDates = new Set(checkinsResult.rows.map((c) => c.date));

  const targetsResult = await pool.query(
    "SELECT due_date, status FROM targets WHERE user_id = $1 AND period = 'daily'",
    [userId]
  );

  const targetsByDate = new Map();
  for (const t of targetsResult.rows) {
    const entry = targetsByDate.get(t.due_date) ?? { total: 0, done: 0 };
    entry.total += 1;
    if (t.status === "done") entry.done += 1;
    targetsByDate.set(t.due_date, entry);
  }

  function dayComplete(dateStr) {
    if (!checkinDates.has(dateStr)) return false;
    const targets = targetsByDate.get(dateStr);
    if (!targets || targets.total === 0) return true;
    return targets.done === targets.total;
  }

  const today = new Date();
  const todayStr = toDateStr(today);
  const todayDone = dayComplete(todayStr);

  // Current streak: walk backward from today (or yesterday if today isn't done yet)
  let current = 0;
  const cursor = new Date(today);
  if (!todayDone) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (dayComplete(toDateStr(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Longest streak: scan all known dates
  const allDates = Array.from(
    new Set([...checkinDates, ...targetsByDate.keys()])
  ).sort();
  let longest = 0;
  let running = 0;
  let prevDate = null;
  for (const dateStr of allDates) {
    const d = new Date(dateStr + "T00:00:00Z");
    const complete = dayComplete(dateStr);
    if (!complete) {
      running = 0;
      prevDate = null;
      continue;
    }
    if (prevDate) {
      const diffDays = Math.round(
        (d.getTime() - prevDate.getTime()) / 86400000
      );
      running = diffDays === 1 ? running + 1 : 1;
    } else {
      running = 1;
    }
    longest = Math.max(longest, running);
    prevDate = d;
  }

  return { current, longest, todayDone };
}
