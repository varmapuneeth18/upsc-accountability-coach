"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/components/UserProvider";
import { apiUrl } from "@/lib/api";

type SwotEntry = {
  id: number;
  period_label: string;
  strengths: string;
  weaknesses: string;
  opportunities: string;
  threats: string;
  action_plan: string;
  created_at: string;
};

type Target = {
  title: string;
  status: "pending" | "done";
  quiz_question: string | null;
  quiz_correct: number | null;
};

type Streak = { current: number; longest: number };

function defaultPeriodLabel() {
  const d = new Date();
  return `Week of ${d.toISOString().slice(0, 10)}`;
}

export default function SwotPage() {
  const { user } = useUser();
  const [entries, setEntries] = useState<SwotEntry[]>([]);
  const [missedTopics, setMissedTopics] = useState<string[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [periodLabel, setPeriodLabel] = useState(defaultPeriodLabel());
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [opportunities, setOpportunities] = useState("");
  const [threats, setThreats] = useState("");
  const [actionPlan, setActionPlan] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [swotRes, targetsRes, checkinRes] = await Promise.all([
      fetch(apiUrl(`/api/swot?userId=${user.id}`)),
      fetch(apiUrl(`/api/targets?userId=${user.id}`)),
      fetch(apiUrl(`/api/checkins?userId=${user.id}`)),
    ]);
    const swotData = await swotRes.json();
    const targetsData = await targetsRes.json();
    const checkinData = await checkinRes.json();
    setEntries(swotData.entries ?? []);
    const targets = (targetsData.targets ?? []) as Target[];
    setMissedTopics(
      targets
        .filter((t) => t.quiz_correct === 0)
        .map((t) => t.title)
        .slice(-5)
    );
    setCompletedCount(targets.filter((t) => t.status === "done").length);
    setStreak(checkinData.streak);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    // Fetching from the API on mount/user-change, not deriving from React state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !periodLabel.trim()) return;
    await fetch(apiUrl("/api/swot"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        periodLabel,
        strengths,
        weaknesses,
        opportunities,
        threats,
        actionPlan,
      }),
    });
    setPeriodLabel(defaultPeriodLabel());
    setStrengths("");
    setWeaknesses("");
    setOpportunities("");
    setThreats("");
    setActionPlan("");
    load();
  }

  if (!user || loading) {
    return <div className="p-6 text-sm text-neutral-500">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">SWOT & course correction</h1>
        <p className="text-sm text-neutral-500">
          Step back periodically. Be honest about what&apos;s working and
          what isn&apos;t, then decide what actually changes next week.
        </p>
      </div>

      <section className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
          <p className="text-xl font-bold">{streak?.current ?? 0}</p>
          <p className="text-xs text-neutral-500">Current streak</p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
          <p className="text-xl font-bold">{completedCount}</p>
          <p className="text-xs text-neutral-500">Targets done</p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
          <p className="text-xl font-bold">{missedTopics.length}</p>
          <p className="text-xs text-neutral-500">Recently missed</p>
        </div>
      </section>

      {missedTopics.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/30">
          <p className="font-medium text-amber-800 dark:text-amber-400">
            Topics you self-marked wrong recently (good weakness fodder):
          </p>
          <ul className="mt-1 list-inside list-disc text-amber-700 dark:text-amber-400">
            {missedTopics.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      <form
        onSubmit={submit}
        className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
      >
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium dark:border-neutral-700 dark:bg-neutral-900"
          value={periodLabel}
          onChange={(e) => setPeriodLabel(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <textarea
            className="h-24 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            placeholder="Strengths"
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
          />
          <textarea
            className="h-24 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            placeholder="Weaknesses"
            value={weaknesses}
            onChange={(e) => setWeaknesses(e.target.value)}
          />
          <textarea
            className="h-24 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            placeholder="Opportunities"
            value={opportunities}
            onChange={(e) => setOpportunities(e.target.value)}
          />
          <textarea
            className="h-24 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            placeholder="Threats"
            value={threats}
            onChange={(e) => setThreats(e.target.value)}
          />
        </div>
        <textarea
          className="h-20 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          placeholder="Action plan for next period — what actually changes?"
          value={actionPlan}
          onChange={(e) => setActionPlan(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-neutral-900"
        >
          Save
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="font-medium">History</h2>
        {entries.length === 0 && (
          <p className="text-sm text-neutral-500">No SWOT entries yet.</p>
        )}
        <ul className="space-y-3">
          {entries.map((e) => (
            <li
              key={e.id}
              className="space-y-1 rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800"
            >
              <p className="font-medium">{e.period_label}</p>
              {e.strengths && <p><span className="text-neutral-500">S:</span> {e.strengths}</p>}
              {e.weaknesses && <p><span className="text-neutral-500">W:</span> {e.weaknesses}</p>}
              {e.opportunities && <p><span className="text-neutral-500">O:</span> {e.opportunities}</p>}
              {e.threats && <p><span className="text-neutral-500">T:</span> {e.threats}</p>}
              {e.action_plan && (
                <p className="text-neutral-600 dark:text-neutral-300">
                  Plan: {e.action_plan}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
