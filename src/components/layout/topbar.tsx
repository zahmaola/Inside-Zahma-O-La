"use client";

import { useRouter } from "next/navigation";
import { Bell, Search } from "lucide-react";

export function Topbar({
  pendingFeedback = 0,
}: {
  pendingFeedback?: number;
  adminName?: string;
}) {
  const router = useRouter();

  return (
    <header className="flex items-center gap-3">
      <div className="glass-panel-soft relative flex h-12 min-w-0 flex-1 items-center rounded-full px-4">
        <Search className="mr-3 h-4 w-4 shrink-0 text-zinc-500" />
        <input
          type="search"
          placeholder="Search employees, feedback, or missions…"
          className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const q = (e.target as HTMLInputElement).value.trim();
              if (q) router.push(`/feedback?q=${encodeURIComponent(q)}`);
            }
          }}
        />
        <kbd className="ml-3 hidden rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-zinc-500 sm:inline">
          ⌘ + K
        </kbd>
      </div>

      <button
        type="button"
        className="glass-panel-soft relative flex h-12 w-12 items-center justify-center rounded-full text-zinc-300 transition hover:bg-white/10 hover:text-white"
        onClick={() => router.push("/feedback?status=new")}
        aria-label="Pending feedback"
      >
        <Bell className="h-4 w-4" />
        {pendingFeedback > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-semibold text-black">
            {pendingFeedback > 99 ? "99+" : pendingFeedback}
          </span>
        ) : null}
      </button>
    </header>
  );
}
