import { ensureRequestRuntime } from "@/lib/request-runtime";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  Bug,
  Target,
  Trophy,
  Users,
  Zap,
  Activity,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import {
  getDepartmentParticipation,
  getLeaderboardPreview,
  getOverviewStats,
  getRecentActivity,
} from "@/lib/data/overview";
import { getMissionProgress } from "@/lib/data/missions";
import { formatNumber, formatPercent, initials } from "@/lib/utils";
import { FeedbackStatusBadge } from "@/components/status-badge";
import type { FeedbackStatus } from "@/types/database";

export default async function OverviewPage() {
  await ensureRequestRuntime();
  const [stats, departments, leaderboard, activity, missions] = await Promise.all([
    getOverviewStats(),
    getDepartmentParticipation(),
    getLeaderboardPreview(5),
    getRecentActivity(10),
    getMissionProgress(),
  ]);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={format(new Date(), "EEEE, MMMM d").toUpperCase()}
        title="Overview"
        description="Punch testing activity. See who showed up this week."
        action={
          <Button asChild>
            <Link href="/feedback">Add feedback</Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total employees"
          value={stats.totalEmployees}
          hint={`${stats.activeEmployees} active in directory`}
          icon={Users}
        />
        <StatCard
          label="Active testers"
          value={stats.activeTestersThisWeek}
          hint="Validated activity this week"
          icon={Activity}
        />
        <StatCard
          label="Participation"
          value={formatPercent(stats.participationRate)}
          hint="Of active employees"
        />
        <StatCard label="Points this week" value={formatNumber(stats.pointsThisWeek)} icon={Zap} />
        <StatCard label="Total feedback" value={stats.totalFeedback} hint={`${stats.feedbackThisWeek} this week`} />
        <StatCard label="Bugs reported" value={stats.totalBugs} icon={Bug} />
        <StatCard
          label="Critical / high"
          value={stats.criticalHighBugs}
          hint={`${stats.openBugs} open bug-class items`}
        />
        <StatCard
          label="Resolved · Missions"
          value={`${stats.resolvedIssues} · ${stats.activeMissions}`}
          icon={Target}
          hint="Resolved issues · active missions"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Department participation</CardTitle>
            <span className="text-xs text-zinc-500">This week</span>
          </CardHeader>
          <CardContent className="space-y-4">
            {departments.length === 0 ? (
              <p className="text-sm text-zinc-500">No department data yet.</p>
            ) : (
              departments.map((row) => (
                <div key={row.departmentId} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-200">{row.departmentName}</span>
                    <span className="text-zinc-500">
                      {row.participatingCount}/{row.employeeCount} · {row.participationRate}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-white"
                      style={{ width: `${Math.min(row.participationRate, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Leaderboard</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/leaderboard">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="divide-y divide-white/10 p-0">
            {leaderboard.map((e) => (
              <Link
                key={e.employeeId}
                href={`/employees/${e.employeeId}`}
                className="flex items-center justify-between gap-3 px-6 py-3.5 transition hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-[11px] text-zinc-300">
                    {initials(e.fullName)}
                  </span>
                  <div>
                    <p className="text-sm text-white">{e.fullName}</p>
                    <p className="text-xs text-zinc-500">#{e.rank}</p>
                  </div>
                </div>
                <span className="text-xs text-zinc-400">{formatNumber(e.points)} pts</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent activity</CardTitle>
            <Trophy className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent className="divide-y divide-white/10 p-0">
            {activity.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="flex items-start justify-between gap-3 px-6 py-4"
              >
                <div>
                  <p className="text-sm text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {item.employeeName ?? "Unknown"} · {item.type}
                    {item.meta && item.type === "feedback" ? (
                      <span className="ml-2 inline-flex">
                        <FeedbackStatusBadge status={item.meta as FeedbackStatus} />
                      </span>
                    ) : item.meta ? (
                      <span className="ml-1 text-zinc-300">{item.meta}</span>
                    ) : null}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-zinc-600">
                  {formatDistanceToNow(new Date(item.occurredAt), { addSuffix: true })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Mission progress</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/missions">Missions</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-white/10 rounded-xl border border-white/10">
              {(
                [
                  ["Total", missions.total],
                  ["Active", missions.active],
                  ["Upcoming", missions.upcoming],
                  ["Completed", missions.completed],
                ] as const
              ).map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <p className="text-sm text-zinc-400">{label}</p>
                  <p className="font-serif text-2xl text-white">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-zinc-500">
              {missions.participationCount} validated participations ·{" "}
              {formatPercent(missions.participationRate)} of active employees
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
