"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/components/UserProvider";

type Mnemonic = {
  id: number;
  topic: string;
  items_json: string;
  mnemonic_text: string;
  created_at: string;
};

export default function MnemonicsPage() {
  const { user } = useUser();
  const [mnemonics, setMnemonics] = useState<Mnemonic[]>([]);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState("");
  const [itemsText, setItemsText] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const res = await fetch(`/api/mnemonics?userId=${user.id}`);
    const data = await res.json();
    setMnemonics(data.mnemonics ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    // Fetching from the API on mount/user-change, not deriving from React state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !topic.trim() || !itemsText.trim()) return;
    const items = itemsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    await fetch("/api/mnemonics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, topic, items }),
    });
    setTopic("");
    setItemsText("");
    load();
  }

  if (!user || loading) {
    return <div className="p-6 text-sm text-neutral-500">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Mnemonic generator</h1>
        <p className="text-sm text-neutral-500">
          Can&apos;t remember an ordered list — National Parks, Geological
          Time Scale, prehistoric sites? Drop the items in and get a silly
          sentence your brain won&apos;t let go of.
        </p>
      </div>

      <form
        onSubmit={generate}
        className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
      >
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          placeholder="Topic, e.g. Geological eras"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <textarea
          className="h-32 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          placeholder={"One item per line, e.g.\nArchean\nProterozoic\nPaleozoic\nMesozoic\nCenozoic"}
          value={itemsText}
          onChange={(e) => setItemsText(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-neutral-900"
        >
          Generate mnemonic
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="font-medium">Saved mnemonics</h2>
        {mnemonics.length === 0 && (
          <p className="text-sm text-neutral-500">Nothing saved yet.</p>
        )}
        <ul className="space-y-3">
          {mnemonics.map((m) => (
            <li
              key={m.id}
              className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
            >
              <p className="font-medium">{m.topic}</p>
              <pre className="mt-1 whitespace-pre-wrap font-sans text-sm text-neutral-600 dark:text-neutral-300">
                {m.mnemonic_text}
              </pre>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
