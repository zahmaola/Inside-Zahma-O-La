import Link from "next/link";
import { Suspense } from "react";
import {
  getLeaderboard,
  getRecognition,
  type LeaderboardPeriod,
} from "@/lib/data/leaderboard";
import { getSettings } from "@/lib/data/settings";
import { Podium } from "@/components/podium";
import { LeaderboardTabs } from "@/components/forms/leaderboard-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/page-header";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; department?: string }>;
}) {
  const { period: periodParam, department } = await searchParams;
  const period = (periodParam as LeaderboardPeriod) ?? "weekly";
  const settings = await getSettings();

  const [board, recognition] = await Promise.all([
    getLeaderboard(
      period,
      period === "department" ? department ?? settings.departments[0]?.id : null,
    ),
    getRecognition(6),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Recognition"
        title="Leaderboard"
        description={`Updated ${format(new Date(board.updatedAt), "MMM d, h:mm a")}`}
      />

      <Suspense fallback={null}>
        <LeaderboardTabs
          period={period}
          departmentId={department ?? settings.departments[0]?.id}
          departments={settings.departments}
        />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Top contributors</CardTitle>
        </CardHeader>
        <CardContent>
          <Podium entries={board.entries} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-zinc-500">
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Name</th>
                <th className="hidden px-4 py-3 md:table-cell">Department</th>
                <th className="px-4 py-3">Feedback</th>
                <th className="px-4 py-3">Points</th>
              </tr>
            </thead>
            <tbody>
              {board.entries.map((e) => (
                <tr key={e.employeeId} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-amber-400">#{e.rank}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/employees/${e.employeeId}`}
                      className="text-white hover:text-amber-300"
                    >
                      {e.fullName}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-400 md:table-cell">
                    {e.departmentName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{e.feedbackCount}</td>
                  <td className="px-4 py-3 font-medium text-white">
                    {formatNumber(e.points)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recognition.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-amber-400/80">Recognition</p>
              <p className="mt-1 font-medium text-white">{item.employeeName}</p>
              <p className="mt-1 text-sm text-zinc-400">{item.reason}</p>
              <p className="mt-2 text-sm text-amber-300">+{item.amount} pts</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}