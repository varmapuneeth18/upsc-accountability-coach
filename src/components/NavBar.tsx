"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/components/UserProvider";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/targets", label: "Targets" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/mnemonics", label: "Mnemonics" },
  { href: "/teach-back", label: "Teach-back" },
  { href: "/explainers", label: "Explainers" },
  { href: "/swot", label: "SWOT" },
  { href: "/breaks", label: "Breaks" },
  { href: "/check-in", label: "Check-in" },
];

export function NavBar() {
  const { user, logout } = useUser();
  const pathname = usePathname();

  if (!user) return null;

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <div className="flex flex-wrap gap-1">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-3 py-1.5 text-sm ${
              pathname === link.href
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <span>{user.username}</span>
        <button
          onClick={logout}
          className="rounded-md border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          Switch user
        </button>
      </div>
    </nav>
  );
}
