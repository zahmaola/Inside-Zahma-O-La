import type { LeaderboardEntry } from "@/lib/data/leaderboard";
import { cn, formatNumber, initials } from "@/lib/utils";
import { Trophy } from "lucide-react";

export function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const top = entries.slice(0, 3);
  const ordered = [top[1], top[0], top[2]].filter(Boolean);

  return (
    <div className="flex items-end justify-center gap-3 px-2 py-4 md:gap-6">
      {ordered.map((entry) => {
        if (!entry) return null;
        const height =
          entry.rank === 1 ? "h-36" : entry.rank === 2 ? "h-28" : "h-24";
        const accent =
          entry.rank === 1
            ? "from-amber-400/30 to-amber-600/10 border-amber-500/30"
            : entry.rank === 2
              ? "from-zinc-300/20 to-zinc-500/5 border-white/15"
              : "from-orange-700/25 to-amber-900/10 border-orange-600/20";

        return (
          <div
            key={entry.employeeId}
            className="flex w-full max-w-[140px] flex-col items-center gap-3"
          >
            <div className="relative">
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-full border bg-gradient-to-br text-lg font-semibold text-white",
                  entry.rank === 1 && "ring-2 ring-amber-500/50",
                  accent,
                )}
              >
                {initials(entry.fullName)}
              </div>
              {entry.rank === 1 ? (
                <Trophy className="absolute -top-3 left-1/2 h-5 w-5 -translate-x-1/2 text-amber-400" />
              ) : null}
            </div>
            <div className="text-center">
              <p className="truncate text-sm font-medium text-white">{entry.fullName}</p>
              <p className="text-xs text-amber-400">{formatNumber(entry.points)} pts</p>
            </div>
            <div
              className={cn(
                "flex w-full flex-col items-center justify-end rounded-t-2xl border border-b-0 bg-gradient-to-b px-2 pb-2 pt-3",
                height,
                accent,
              )}
            >
              <span className="text-2xl font-bold text-white/90">#{entry.rank}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}