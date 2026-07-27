"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/components/UserProvider";

type Period = "daily" | "weekly" | "monthly";

type Target = {
  id: number;
  period: Period;
  title: string;
  due_date: string;
  status: "pending" | "done";
  proof_note: string | null;
  quiz_question: string | null;
  quiz_answer: string | null;
  quiz_correct: number | null;
  stake_amount: number | null;
  stake_settled: number;
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const PERIODS: Period[] = ["daily", "weekly", "monthly"];

export default function TargetsPage() {
  const { user } = useUser();
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const [period, setPeriod] = useState<Period>("daily");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(todayStr());
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizAnswer, setQuizAnswer] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const res = await fetch(`/api/targets?userId=${user.id}`);
    const data = await res.json();
    setTargets(data.targets ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    // Fetching from the API on mount/user-change, not deriving from React state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function createTarget(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !title.trim()) return;
    await fetch("/api/targets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        period,
        title,
        dueDate,
        quizQuestion: quizQuestion || null,
        quizAnswer: quizAnswer || null,
        stakeAmount: stakeAmount ? Number(stakeAmount) : null,
      }),
    });
    setTitle("");
    setQuizQuestion("");
    setQuizAnswer("");
    setStakeAmount("");
    load();
  }

  async function markQuizResult(id: number, correct: boolean) {
    await fetch(`/api/targets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizCorrect: correct }),
    });
    load();
  }

  async function settleStake(id: number) {
    await fetch(`/api/targets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stakeSettled: true }),
    });
    load();
  }

  async function toggleStatus(t: Target) {
    await fetch(`/api/targets/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: t.status === "done" ? "pending" : "done",
      }),
    });
    load();
  }

  async function remove(id: number) {
    await fetch(`/api/targets/${id}`, { method: "DELETE" });
    load();
  }

  if (!user || loading) {
    return <div className="p-6 text-sm text-neutral-500">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <h1 className="text-2xl font-semibold">Targets</h1>

      <form
        onSubmit={createTarget}
        className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
      >
        <p className="font-medium">New target</p>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1 text-sm capitalize ${
                period === p
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "border border-neutral-300 dark:border-neutral-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          placeholder="e.g. Finish Laxmikant Chapters 12-15"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-500">Due:</label>
          <input
            type="date"
            className="rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <details className="text-sm">
          <summary className="cursor-pointer text-neutral-500">
            Add a self-quiz question (optional)
          </summary>
          <div className="mt-2 space-y-2">
            <input
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              placeholder="Question, e.g. Who chairs the Finance Commission?"
              value={quizQuestion}
              onChange={(e) => setQuizQuestion(e.target.value)}
            />
            <input
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              placeholder="Answer"
              value={quizAnswer}
              onChange={(e) => setQuizAnswer(e.target.value)}
            />
          </div>
        </details>
        <details className="text-sm">
          <summary className="cursor-pointer text-neutral-500">
            Put money on it (optional)
          </summary>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-neutral-500">₹</span>
            <input
              type="number"
              min="0"
              className="w-28 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              placeholder="e.g. 100"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
            />
            <span className="text-xs text-neutral-400">
              owed to yourself/a friend if you miss this — you settle up
              outside the app.
            </span>
          </div>
        </details>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-neutral-900"
        >
          Add target
        </button>
      </form>

      {PERIODS.map((p) => {
        const group = targets.filter((t) => t.period === p);
        if (group.length === 0) return null;
        return (
          <section key={p} className="space-y-2">
            <h2 className="font-medium capitalize">{p} targets</h2>
            <ul className="space-y-2">
              {group.map((t) => (
                <li
                  key={t.id}
                  className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span
                        className={
                          t.status === "done"
                            ? "line-through text-neutral-400"
                            : ""
                        }
                      >
                        {t.title}
                      </span>
                      <span className="ml-2 text-xs text-neutral-400">
                        due {t.due_date}
                      </span>
                      {t.stake_amount ? (
                        <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                          ₹{t.stake_amount} staked
                        </span>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => toggleStatus(t)}
                        className={`rounded-md px-3 py-1 text-xs ${
                          t.status === "done"
                            ? "border border-neutral-300 dark:border-neutral-700"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {t.status === "done" ? "Reopen" : "Done"}
                      </button>
                      <button
                        onClick={() => remove(t.id)}
                        className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-red-500 dark:border-neutral-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {t.proof_note && (
                    <p className="mt-2 text-xs text-neutral-500">
                      Proof: {t.proof_note}
                    </p>
                  )}
                  {t.quiz_question && (
                    <div className="mt-2 rounded-md bg-neutral-50 p-2 text-xs dark:bg-neutral-900">
                      <p className="font-medium">Q: {t.quiz_question}</p>
                      {revealed[t.id] ? (
                        <>
                          <p className="mt-1 text-neutral-600 dark:text-neutral-300">
                            A: {t.quiz_answer}
                          </p>
                          {t.quiz_correct === null ? (
                            <div className="mt-1 flex gap-2">
                              <button
                                onClick={() => markQuizResult(t.id, true)}
                                className="rounded-md bg-emerald-600 px-2 py-0.5 text-white"
                              >
                                Got it right
                              </button>
                              <button
                                onClick={() => markQuizResult(t.id, false)}
                                className="rounded-md bg-red-500 px-2 py-0.5 text-white"
                              >
                                Got it wrong
                              </button>
                            </div>
                          ) : (
                            <p className="mt-1 text-neutral-400">
                              {t.quiz_correct ? "✓ You got this right" : "✗ You missed this — good SWOT fodder"}
                            </p>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() =>
                            setRevealed((r) => ({ ...r, [t.id]: true }))
                          }
                          className="mt-1 underline"
                        >
                          Reveal answer
                        </button>
                      )}
                    </div>
                  )}
                  {t.stake_amount != null &&
                    t.due_date < todayStr() &&
                    t.status === "pending" &&
                    t.stake_settled === 0 && (
                      <div className="mt-2 flex items-center justify-between rounded-md bg-red-50 p-2 text-xs dark:bg-red-950/30">
                        <span className="text-red-700 dark:text-red-400">
                          Missed — you owe ₹{t.stake_amount}
                        </span>
                        <button
                          onClick={() => settleStake(t.id)}
                          className="rounded-md border border-red-300 px-2 py-0.5 text-red-700 dark:border-red-800 dark:text-red-400"
                        >
                          Mark settled
                        </button>
                      </div>
                    )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {targets.length === 0 && (
        <p className="text-sm text-neutral-500">
          No targets yet. Add your first one above.
        </p>
      )}
    </div>
  );
}
