"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useUser } from "@/components/UserProvider";

type Target = {
  id: number;
  title: string;
  due_date: string;
  status: "pending" | "done";
  proof_note: string | null;
  stake_amount: number | null;
  stake_settled: number;
};

type Streak = { current: number; longest: number; todayDone: boolean };

type Checkin = {
  study_hours: number | null;
  screenshot_data: string | null;
} | null;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const { user } = useUser();
  const [checkin, setCheckin] = useState<Checkin>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [weeklyHours, setWeeklyHours] = useState(0);
  const [targets, setTargets] = useState<Target[]>([]);
  const [allTargets, setAllTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [proofDraft, setProofDraft] = useState<Record<number, string>>({});
  const [hoursDraft, setHoursDraft] = useState("");
  const [screenshotDraft, setScreenshotDraft] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [checkinRes, targetsRes, allTargetsRes] = await Promise.all([
      fetch(`/api/checkins?userId=${user.id}`),
      fetch(`/api/targets?userId=${user.id}&period=daily`),
      fetch(`/api/targets?userId=${user.id}`),
    ]);
    const checkinData = await checkinRes.json();
    const targetsData = await targetsRes.json();
    const allTargetsData = await allTargetsRes.json();
    setCheckin(checkinData.checkin);
    setStreak(checkinData.streak);
    setWeeklyHours(checkinData.weeklyHours ?? 0);
    setTargets(
      (targetsData.targets as Target[]).filter(
        (t) => t.due_date === todayStr()
      )
    );
    setAllTargets(allTargetsData.targets ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    // Fetching from the API on mount/user-change, not deriving from React state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function saveCheckin() {
    if (!user) return;
    const studyHours = hoursDraft ? Number(hoursDraft) : undefined;
    await fetch("/api/checkins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        studyHours,
        screenshotData: screenshotDraft ?? undefined,
      }),
    });
    setHoursDraft("");
    setScreenshotDraft(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    load();
  }

  function onScreenshotChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setScreenshotDraft(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function completeTarget(id: number) {
    const proofNote = proofDraft[id] ?? "";
    await fetch(`/api/targets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done", proofNote }),
    });
    load();
  }

  async function reopenTarget(id: number) {
    await fetch(`/api/targets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pending" }),
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

  if (!user || loading) {
    return <div className="p-6 text-sm text-neutral-500">Loading...</div>;
  }

  const doneCount = targets.filter((t) => t.status === "done").length;
  const today = todayStr();
  const owedStakes = allTargets.filter(
    (t) =>
      t.stake_amount &&
      t.stake_settled === 0 &&
      t.status === "pending" &&
      t.due_date < today
  );
  const totalOwed = owedStakes.reduce((s, t) => s + (t.stake_amount ?? 0), 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Good day, {user.username}</h1>
        <p className="text-sm text-neutral-500">{today}</p>
      </div>

      <section className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Schedule acknowledgement</p>
            <p className="text-sm text-neutral-500">
              Confirm you&apos;re up, log your hours, drop proof.
            </p>
          </div>
          <button
            onClick={saveCheckin}
            className="shrink-0 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-neutral-900"
          >
            {checkin ? "Update check-in" : "I'm up"}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-neutral-500">Study hours today:</span>
            <input
              type="number"
              step="0.5"
              min="0"
              className="w-20 rounded-md border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
              placeholder={checkin?.study_hours?.toString() ?? "0"}
              value={hoursDraft}
              onChange={(e) => setHoursDraft(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-neutral-500">Blocker-app screenshot:</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onScreenshotChange}
              className="text-xs"
            />
          </label>
        </div>
        <p className="text-xs text-neutral-400">
          This week: {weeklyHours.toFixed(1)}h logged
        </p>
        {checkin?.screenshot_data && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={checkin.screenshot_data}
            alt="Today's blocker-app screenshot"
            className="h-24 w-auto rounded-md border border-neutral-200 dark:border-neutral-800"
          />
        )}
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-neutral-200 p-4 text-center dark:border-neutral-800">
          <p className="text-3xl font-bold">{streak?.current ?? 0}</p>
          <p className="text-sm text-neutral-500">Current streak</p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 text-center dark:border-neutral-800">
          <p className="text-3xl font-bold">{streak?.longest ?? 0}</p>
          <p className="text-sm text-neutral-500">Longest streak</p>
        </div>
      </section>

      {owedStakes.length > 0 && (
        <section className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
          <p className="font-medium text-red-700 dark:text-red-400">
            You owe ₹{totalOwed} in forfeited stakes
          </p>
          <ul className="space-y-1">
            {owedStakes.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between text-sm"
              >
                <span>
                  {t.title} — ₹{t.stake_amount} (due {t.due_date})
                </span>
                <button
                  onClick={() => settleStake(t.id)}
                  className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 dark:border-red-800 dark:text-red-400"
                >
                  Mark settled
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">
            Today&apos;s targets ({doneCount}/{targets.length})
          </h2>
        </div>
        {targets.length === 0 && (
          <p className="text-sm text-neutral-500">
            No daily targets set for today. Add some on the{" "}
            <a href="/targets" className="underline">
              Targets
            </a>{" "}
            page.
          </p>
        )}
        <ul className="space-y-2">
          {targets.map((t) => (
            <li
              key={t.id}
              className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={
                    t.status === "done" ? "line-through text-neutral-400" : ""
                  }
                >
                  {t.title}
                  {t.stake_amount ? ` (₹${t.stake_amount} staked)` : ""}
                </span>
                {t.status === "done" ? (
                  <button
                    onClick={() => reopenTarget(t.id)}
                    className="shrink-0 rounded-md border border-neutral-300 px-3 py-1 text-xs dark:border-neutral-700"
                  >
                    Reopen
                  </button>
                ) : (
                  <button
                    onClick={() => completeTarget(t.id)}
                    className="shrink-0 rounded-md bg-emerald-600 px-3 py-1 text-xs text-white"
                  >
                    Done
                  </button>
                )}
              </div>
              {t.status !== "done" && (
                <input
                  className="mt-2 w-full rounded-md border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                  placeholder="Proof note (what did you actually do?)"
                  value={proofDraft[t.id] ?? ""}
                  onChange={(e) =>
                    setProofDraft((d) => ({ ...d, [t.id]: e.target.value }))
                  }
                />
              )}
              {t.status === "done" && t.proof_note && (
                <p className="mt-2 text-xs text-neutral-500">
                  Proof: {t.proof_note}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
