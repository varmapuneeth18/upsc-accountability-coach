"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/components/UserProvider";

type QA = { question: string; answer: string; category: string };
type Mode = "jeopardy" | "lastStanding" | "feud";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function loadPool(userId: number): Promise<QA[]> {
  const [targetsRes, explainersRes] = await Promise.all([
    fetch(`/api/targets?userId=${userId}`),
    fetch(`/api/explainers`),
  ]);
  const targetsData = await targetsRes.json();
  const explainersData = await explainersRes.json();

  const fromTargets: QA[] = (targetsData.targets ?? [])
    .filter((t: { quiz_question: string | null }) => t.quiz_question)
    .map((t: { quiz_question: string; quiz_answer: string; period: string }) => ({
      question: t.quiz_question,
      answer: t.quiz_answer,
      category: "Your quizzes",
    }));

  const fromExplainers: QA[] = (explainersData.explainers ?? []).map(
    (e: { topic: string; one_liner: string; subject: string }) => ({
      question: `What's the one-liner for "${e.topic}"?`,
      answer: e.one_liner,
      category: e.subject,
    })
  );

  return shuffle([...fromTargets, ...fromExplainers]);
}

export default function BreaksPage() {
  const { user } = useUser();
  const [pool, setPool] = useState<QA[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("jeopardy");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const p = await loadPool(user.id);
    setPool(p);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    // Fetching from the API on mount/user-change, not deriving from React state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function saveScore(gameType: string, score: number) {
    if (!user) return;
    await fetch("/api/game-scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, gameType, score }),
    });
  }

  if (!user || loading) {
    return <div className="p-6 text-sm text-neutral-500">Loading...</div>;
  }

  if (pool.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <h1 className="text-2xl font-semibold">Break-time game shows</h1>
        <p className="text-sm text-neutral-500">
          Not enough questions yet. Add a self-quiz question on a target, or
          browse the{" "}
          <a href="/explainers" className="underline">
            explainers
          </a>{" "}
          library, then come back.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Break-time game shows</h1>
        <p className="text-sm text-neutral-500">
          Refreshing beats doom-scrolling. Pick a mode, self-score honestly.
        </p>
      </div>

      <div className="flex gap-2">
        {(
          [
            ["jeopardy", "Jeopardy"],
            ["lastStanding", "Last Person Standing"],
            ["feud", "Family Feud"],
          ] as [Mode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              mode === m
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "border border-neutral-300 dark:border-neutral-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "jeopardy" && <Jeopardy pool={pool} onFinish={(s) => saveScore("jeopardy", s)} />}
      {mode === "lastStanding" && (
        <LastPersonStanding pool={pool} onFinish={(s) => saveScore("lastStanding", s)} />
      )}
      {mode === "feud" && <FamilyFeud pool={pool} onFinish={(s) => saveScore("feud", s)} />}
    </div>
  );
}

function Jeopardy({
  pool,
  onFinish,
}: {
  pool: QA[];
  onFinish: (score: number) => void;
}) {
  const [board, setBoard] = useState<Record<string, (QA | null)[]>>({});
  const [used, setUsed] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<{ cat: string; idx: number } | null>(
    null
  );
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);

  const buildBoard = useCallback(() => {
    const byCategory = new Map<string, QA[]>();
    for (const qa of pool) {
      const list = byCategory.get(qa.category) ?? [];
      list.push(qa);
      byCategory.set(qa.category, list);
    }
    const categories = shuffle([...byCategory.keys()]).slice(0, 5);
    const b: Record<string, (QA | null)[]> = {};
    for (const cat of categories) {
      const items = shuffle(byCategory.get(cat) ?? []).slice(0, 3);
      b[cat] = [items[0] ?? null, items[1] ?? null, items[2] ?? null];
    }
    setBoard(b);
    setUsed(new Set());
    setActive(null);
    setRevealed(false);
    setScore(0);
  }, [pool]);

  useEffect(() => {
    // Building board from static pool prop, not deriving from React state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buildBoard();
  }, [buildBoard]);

  const values = [100, 200, 300];
  const categories = Object.keys(board);
  const totalCells = categories.reduce(
    (sum, c) => sum + board[c].filter(Boolean).length,
    0
  );
  const allUsed = used.size >= totalCells && totalCells > 0;

  function pick(cat: string, idx: number) {
    if (!board[cat][idx] || used.has(`${cat}-${idx}`)) return;
    setActive({ cat, idx });
    setRevealed(false);
  }

  function answer(correct: boolean) {
    if (!active) return;
    const key = `${active.cat}-${active.idx}`;
    const value = values[active.idx];
    setScore((s) => s + (correct ? value : -value));
    setUsed((u) => new Set(u).add(key));
    setActive(null);
    setRevealed(false);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm">
        Score: <span className="font-bold">{score}</span>
      </p>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}
      >
        {categories.map((cat) => (
          <div key={cat} className="text-center text-xs font-medium">
            {cat}
          </div>
        ))}
        {values.map((value, idx) =>
          categories.map((cat) => {
            const qa = board[cat][idx];
            const key = `${cat}-${idx}`;
            const isUsed = used.has(key);
            return (
              <button
                key={key}
                disabled={!qa || isUsed}
                onClick={() => pick(cat, idx)}
                className={`rounded-md border p-3 text-sm font-semibold ${
                  !qa || isUsed
                    ? "border-neutral-100 text-neutral-300 dark:border-neutral-900 dark:text-neutral-700"
                    : "border-neutral-300 bg-neutral-50 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                }`}
              >
                {qa && !isUsed ? value : ""}
              </button>
            );
          })
        )}
      </div>

      {active && board[active.cat][active.idx] && (
        <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
          <p className="text-sm font-medium">
            {board[active.cat][active.idx]!.question}
          </p>
          {revealed ? (
            <>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                {board[active.cat][active.idx]!.answer}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => answer(true)}
                  className="rounded-md bg-emerald-600 px-3 py-1 text-xs text-white"
                >
                  Got it right
                </button>
                <button
                  onClick={() => answer(false)}
                  className="rounded-md bg-red-500 px-3 py-1 text-xs text-white"
                >
                  Got it wrong
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setRevealed(true)}
              className="mt-2 rounded-md border border-neutral-300 px-3 py-1 text-xs dark:border-neutral-700"
            >
              Reveal answer
            </button>
          )}
        </div>
      )}

      {allUsed && (
        <div className="rounded-lg border border-neutral-200 p-3 text-center dark:border-neutral-800">
          <p className="font-medium">Final score: {score}</p>
          <button
            onClick={() => {
              onFinish(score);
              buildBoard();
            }}
            className="mt-2 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-neutral-900"
          >
            Save score & play again
          </button>
        </div>
      )}
    </div>
  );
}

function LastPersonStanding({
  pool,
  onFinish,
}: {
  pool: QA[];
  onFinish: (score: number) => void;
}) {
  const [queue, setQueue] = useState<QA[]>([]);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const start = useCallback(() => {
    setQueue(shuffle(pool));
    setScore(0);
    setOver(false);
    setRevealed(false);
  }, [pool]);

  useEffect(() => {
    // Building queue from static pool prop, not deriving from React state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    start();
  }, [start]);

  function answer(correct: boolean) {
    if (correct) {
      setScore((s) => s + 1);
      setQueue((q) => q.slice(1));
      setRevealed(false);
      if (queue.length <= 1) setOver(true);
    } else {
      setOver(true);
    }
  }

  const current = queue[0];

  return (
    <div className="space-y-3">
      <p className="text-sm">
        Streak: <span className="font-bold">{score}</span>
      </p>
      {!over && current && (
        <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
          <p className="text-sm font-medium">{current.question}</p>
          {revealed ? (
            <>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                {current.answer}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => answer(true)}
                  className="rounded-md bg-emerald-600 px-3 py-1 text-xs text-white"
                >
                  Got it right
                </button>
                <button
                  onClick={() => answer(false)}
                  className="rounded-md bg-red-500 px-3 py-1 text-xs text-white"
                >
                  Got it wrong
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setRevealed(true)}
              className="mt-2 rounded-md border border-neutral-300 px-3 py-1 text-xs dark:border-neutral-700"
            >
              Reveal answer
            </button>
          )}
        </div>
      )}
      {over && (
        <div className="rounded-lg border border-neutral-200 p-3 text-center dark:border-neutral-800">
          <p className="font-medium">You&apos;re out. Final streak: {score}</p>
          <button
            onClick={() => {
              onFinish(score);
              start();
            }}
            className="mt-2 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-neutral-900"
          >
            Save score & play again
          </button>
        </div>
      )}
    </div>
  );
}

const FEUD_ROUNDS = 10;

function FamilyFeud({
  pool,
  onFinish,
}: {
  pool: QA[];
  onFinish: (score: number) => void;
}) {
  const [rounds, setRounds] = useState<QA[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);

  const start = useCallback(() => {
    setRounds(shuffle(pool).slice(0, FEUD_ROUNDS));
    setIndex(0);
    setScore(0);
    setRevealed(false);
    setDone(false);
  }, [pool]);

  useEffect(() => {
    // Building rounds from static pool prop, not deriving from React state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    start();
  }, [start]);

  function answer(correct: boolean) {
    if (correct) setScore((s) => s + 1);
    if (index + 1 >= rounds.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setRevealed(false);
    }
  }

  const current = rounds[index];

  return (
    <div className="space-y-3">
      <p className="text-sm">
        Round {Math.min(index + 1, rounds.length)}/{rounds.length} — Score:{" "}
        <span className="font-bold">{score}</span>
      </p>
      {!done && current && (
        <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
          <p className="text-sm font-medium">{current.question}</p>
          <p className="mt-1 text-xs text-neutral-400">
            Say your answer out loud, then reveal the top answer.
          </p>
          {revealed ? (
            <>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                {current.answer}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => answer(true)}
                  className="rounded-md bg-emerald-600 px-3 py-1 text-xs text-white"
                >
                  Matched it
                </button>
                <button
                  onClick={() => answer(false)}
                  className="rounded-md bg-red-500 px-3 py-1 text-xs text-white"
                >
                  Nope
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setRevealed(true)}
              className="mt-2 rounded-md border border-neutral-300 px-3 py-1 text-xs dark:border-neutral-700"
            >
              Reveal top answer
            </button>
          )}
        </div>
      )}
      {done && (
        <div className="rounded-lg border border-neutral-200 p-3 text-center dark:border-neutral-800">
          <p className="font-medium">
            Final score: {score}/{rounds.length}
          </p>
          <button
            onClick={() => {
              onFinish(score);
              start();
            }}
            className="mt-2 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-neutral-900"
          >
            Save score & play again
          </button>
        </div>
      )}
    </div>
  );
}
