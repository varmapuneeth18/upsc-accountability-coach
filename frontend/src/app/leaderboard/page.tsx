"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/components/UserProvider";
import { apiUrl } from "@/lib/api";

type Row = {
  userId: number;
  username: string;
  currentStreak: number;
  longestStreak: number;
  completedCount: number;
  badges: string[];
};

export default function LeaderboardPage() {
  const { user } = useUser();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl("/api/leaderboard"))
      .then((r) => r.json())
      .then((data) => setRows(data.leaderboard ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-sm text-neutral-500">Loading...</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Leaderboard</h1>
      <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left dark:bg-neutral-900">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Aspirant</th>
              <th className="px-3 py-2">Streak</th>
              <th className="px-3 py-2">Best</th>
              <th className="px-3 py-2">Done</th>
              <th className="px-3 py-2">Badges</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.userId}
                className={`border-t border-neutral-200 dark:border-neutral-800 ${
                  row.userId === user?.id
                    ? "bg-amber-50 dark:bg-amber-950/30"
                    : ""
                }`}
              >
                <td className="px-3 py-2">{idx + 1}</td>
                <td className="px-3 py-2 font-medium">{row.username}</td>
                <td className="px-3 py-2">{row.currentStreak}🔥</td>
                <td className="px-3 py-2">{row.longestStreak}</td>
                <td className="px-3 py-2">{row.completedCount}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {row.badges.map((b) => (
                      <span
                        key={b}
                        className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-800"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <p className="text-sm text-neutral-500">
          No aspirants yet — invite your study group to join.
        </p>
      )}
    </div>
  );
}
