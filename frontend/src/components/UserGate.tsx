"use client";

import { useState } from "react";
import { useUser } from "@/components/UserProvider";

export function UserGate({ children }: { children: React.ReactNode }) {
  const { user, ready, login } = useUser();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!ready) return null;

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center gap-4 px-4">
        <h1 className="text-xl font-semibold">Who&apos;s studying today?</h1>
        <p className="text-sm text-neutral-500">
          Pick a username. New name creates a fresh account, existing name
          logs you back in.
        </p>
        <form
          className="flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setSubmitting(true);
            try {
              await login(name);
            } catch {
              setError("Something went wrong. Try again.");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <input
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            placeholder="e.g. rahul_upsc"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="rounded-md bg-neutral-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            {submitting ? "..." : "Start"}
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
