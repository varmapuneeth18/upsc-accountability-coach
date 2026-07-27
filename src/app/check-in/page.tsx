"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/components/UserProvider";

type MoodEntry = {
  id: number;
  date: string;
  mood: number;
  note: string | null;
};

type JournalEntry = {
  id: number;
  entry_text: string;
  created_at: string;
};

const MOODS = [
  { value: 1, emoji: "😞", label: "Rough" },
  { value: 2, emoji: "😕", label: "Low" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
];

export default function CheckInPage() {
  const { user } = useUser();
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [todayMood, setTodayMood] = useState<MoodEntry | null>(null);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [moodNote, setMoodNote] = useState("");
  const [rant, setRant] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [moodRes, journalRes] = await Promise.all([
      fetch(`/api/mood?userId=${user.id}`),
      fetch(`/api/journal?userId=${user.id}`),
    ]);
    const moodData = await moodRes.json();
    const journalData = await journalRes.json();
    setMoodEntries(moodData.entries ?? []);
    setTodayMood(moodData.todayEntry);
    setJournal(journalData.entries ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    // Fetching from the API on mount/user-change, not deriving from React state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function setMood(value: number) {
    if (!user) return;
    await fetch("/api/mood", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, mood: value, note: moodNote }),
    });
    setMoodNote("");
    load();
  }

  async function saveRant(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !rant.trim()) return;
    await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, entryText: rant }),
    });
    setRant("");
    load();
  }

  if (!user || loading) {
    return <div className="p-6 text-sm text-neutral-500">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Check in with yourself</h1>
        <p className="text-sm text-neutral-500">
          UPSC prep is lonely. This is a judgment-free space — no advice
          unless you ask, no guilt for a bad day.
        </p>
      </div>

      <section className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <p className="font-medium">How are you today?</p>
        <div className="flex justify-between">
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMood(m.value)}
              className={`flex flex-col items-center gap-1 rounded-md px-3 py-2 text-2xl ${
                todayMood?.mood === m.value
                  ? "bg-neutral-900 dark:bg-white"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              <span>{m.emoji}</span>
              <span className="text-xs text-neutral-500">{m.label}</span>
            </button>
          ))}
        </div>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          placeholder="Optional: what's making today feel this way?"
          value={moodNote}
          onChange={(e) => setMoodNote(e.target.value)}
        />
        {todayMood && (
          <p className="text-xs text-neutral-400">
            Logged today: {MOODS.find((m) => m.value === todayMood.mood)?.emoji}
          </p>
        )}
      </section>

      <section className="flex gap-1">
        {moodEntries
          .slice()
          .reverse()
          .slice(-14)
          .map((m) => (
            <div
              key={m.id}
              title={`${m.date}: ${MOODS.find((x) => x.value === m.mood)?.label}`}
              className="flex h-8 flex-1 items-center justify-center rounded bg-neutral-100 text-sm dark:bg-neutral-900"
            >
              {MOODS.find((x) => x.value === m.mood)?.emoji}
            </div>
          ))}
      </section>

      <form
        onSubmit={saveRant}
        className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
      >
        <p className="font-medium">Rant space</p>
        <textarea
          className="h-32 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          placeholder="Say whatever you need to. It's just for you."
          value={rant}
          onChange={(e) => setRant(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-neutral-900"
        >
          Save
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="font-medium">Past entries</h2>
        {journal.length === 0 && (
          <p className="text-sm text-neutral-500">Nothing logged yet.</p>
        )}
        <ul className="space-y-2">
          {journal.map((j) => (
            <li
              key={j.id}
              className="rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800"
            >
              <p className="text-xs text-neutral-400">
                {j.created_at.slice(0, 10)}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-neutral-600 dark:text-neutral-300">
                {j.entry_text}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-500 dark:bg-neutral-900">
        This isn&apos;t a substitute for professional support. If you&apos;re
        really struggling, India&apos;s KIRAN mental health helpline is free
        and available 24/7: <strong>1800-599-0019</strong>.
      </p>
    </div>
  );
}
