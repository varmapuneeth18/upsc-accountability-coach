"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type CurrentUser = { id: number; username: string };

type UserContextValue = {
  user: CurrentUser | null;
  ready: boolean;
  login: (username: string) => Promise<void>;
  logout: () => void;
};

const UserContext = createContext<UserContextValue | null>(null);

const STORAGE_KEY = "acc-coach-user";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        // Reading persisted session from localStorage on mount, not deriving from React state.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(raw));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setReady(true);
  }, []);

  async function login(username: string) {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    if (!res.ok) throw new Error("Could not log in");
    const data = await res.json();
    setUser(data.user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <UserContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
