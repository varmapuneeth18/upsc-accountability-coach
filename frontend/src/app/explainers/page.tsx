"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/components/UserProvider";
import { apiUrl } from "@/lib/api";

type Explainer = {
  id: number;
  subject: string;
  topic: string;
  one_liner: string;
};

export default function ExplainersPage() {
  const { user } = useUser();
  const [explainers, setExplainers] = useState<Explainer[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectFilter, setSubjectFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [oneLiner, setOneLiner] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (subjectFilter !== "All") params.set("subject", subjectFilter);
    if (search) params.set("q", search);
    const res = await fetch(apiUrl(`/api/explainers?${params.toString()}`));
    const data = await res.json();
    setExplainers(data.explainers ?? []);
    setSubjects(data.subjects ?? []);
    setLoading(false);
  }, [subjectFilter, search]);

  useEffect(() => {
    // Fetching from the API on filter change, not deriving from React state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function addExplainer(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !topic.trim() || !oneLiner.trim()) return;
    await fetch(apiUrl("/api/explainers"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        topic,
        oneLiner,
        createdBy: user?.username,
      }),
    });
    setSubject("");
    setTopic("");
    setOneLiner("");
    load();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Syllabus one-liners</h1>
        <p className="text-sm text-neutral-500">
          Quick, colloquial context-setters so you don&apos;t have to flip
          back through an NCERT to remember why a topic matters or what
          connects to what.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSubjectFilter("All")}
          className={`rounded-md px-3 py-1 text-sm ${
            subjectFilter === "All"
              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
              : "border border-neutral-300 dark:border-neutral-700"
          }`}
        >
          All
        </button>
        {subjects.map((s) => (
          <button
            key={s}
            onClick={() => setSubjectFilter(s)}
            className={`rounded-md px-3 py-1 text-sm ${
              subjectFilter === s
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "border border-neutral-300 dark:border-neutral-700"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <input
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        placeholder="Search a topic..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p className="text-sm text-neutral-500">Loading...</p>
      ) : (
        <ul className="space-y-2">
          {explainers.map((e) => (
            <li
              key={e.id}
              className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
            >
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-800">
                  {e.subject}
                </span>
                <p className="font-medium">{e.topic}</p>
              </div>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                {e.one_liner}
              </p>
            </li>
          ))}
          {explainers.length === 0 && (
            <p className="text-sm text-neutral-500">No matches found.</p>
          )}
        </ul>
      )}

      <form
        onSubmit={addExplainer}
        className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
      >
        <p className="font-medium">Add your own</p>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          placeholder="Subject, e.g. History"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          placeholder="Topic, e.g. Champaran Satyagraha"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <textarea
          className="h-20 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          placeholder="One colloquial line that sets the context..."
          value={oneLiner}
          onChange={(e) => setOneLiner(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-neutral-900"
        >
          Save one-liner
        </button>
      </form>
    </div>
  );
}
