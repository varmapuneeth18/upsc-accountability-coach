"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/components/UserProvider";
import { apiUrl } from "@/lib/api";

type Teachback = {
  id: number;
  topic: string;
  explanation: string;
  created_at: string;
};

export default function TeachBackPage() {
  const { user } = useUser();
  const [entries, setEntries] = useState<Teachback[]>([]);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState("");
  const [explanation, setExplanation] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const res = await fetch(apiUrl(`/api/teachbacks?userId=${user.id}`));
    const data = await res.json();
    setEntries(data.teachbacks ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    // Fetching from the API on mount/user-change, not deriving from React state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !topic.trim() || !explanation.trim()) return;
    await fetch(apiUrl("/api/teachbacks"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, topic, explanation }),
    });
    setTopic("");
    setExplanation("");
    load();
  }

  if (!user || loading) {
    return <div className="p-6 text-sm text-neutral-500">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Teach it back</h1>
        <p className="text-sm text-neutral-500">
          Pick the topic you&apos;ve been avoiding. Explain it here as if
          you&apos;re teaching a beginner — writing it out is one of the best
          ways to find the gaps.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
      >
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          placeholder="Topic, e.g. GST Council composition"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <textarea
          className="h-40 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          placeholder="Explain it in your own words..."
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-neutral-900"
        >
          Save
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="font-medium">Past explanations</h2>
        {entries.length === 0 && (
          <p className="text-sm text-neutral-500">Nothing logged yet.</p>
        )}
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">{entry.topic}</p>
                <span className="text-xs text-neutral-400">
                  {entry.created_at.slice(0, 10)}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-300">
                {entry.explanation}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
