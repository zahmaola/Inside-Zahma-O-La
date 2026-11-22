import { ensureRequestRuntime } from "@/lib/request-runtime";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  getEmployee,
  getEmployeeHistory,
  getEmployeeStats,
} from "@/lib/data/employees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { EmployeeStatusBadge } from "@/components/status-badge";
import { TestingSessionForm } from "@/components/forms/testing-session-form";
import { Button } from "@/components/ui/button";
import { formatNumber, initials } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await ensureRequestRuntime();
  const { id } = await params;
  const employee = await getEmployee(id);
  if (!employee) notFound();

  const [stats, history] = await Promise.all([
    getEmployeeStats(id),
    getEmployeeHistory(id),
  ]);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="gap-2">
        <Link href="/employees">
          <ArrowLeft className="h-4 w-4" />
          Back to employees
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/20 to-transparent text-xl font-semibold">
            {initials(employee.full_name)}
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-white">{employee.full_name}</h1>
            <p className="text-sm text-zinc-500">
              {employee.job_title ?? "—"} · {employee.departments?.name ?? "No department"}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <EmployeeStatusBadge status={employee.status} />
              <span className="text-xs text-zinc-600">
                Added {format(new Date(employee.date_added), "MMM d, yyyy")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total points" value={formatNumber(stats.totalPoints)} />
        <StatCard label="Feedback" value={stats.feedbackCount} />
        <StatCard label="Sessions" value={stats.sessionsCount} />
        <StatCard
          label="Rank"
          value={stats.rank ?? "—"}
          hint={`${stats.missionsCompleted} missions validated`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contribution history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.map((item) => (
              <div
                key={`${item.kind}-${item.id}`}
                className="flex items-start justify-between border-b border-white/5 pb-3 last:border-0"
              >
                <div>
                  <p className="text-sm text-white">{item.title}</p>
                  <p className="text-xs capitalize text-zinc-500">{item.kind}</p>
                </div>
                <div className="text-right text-xs text-zinc-500">
                  {format(new Date(item.occurredAt), "MMM d, yyyy")}
                  {item.points ? (
                    <span className="block text-amber-400">+{item.points}</span>
                  ) : null}
                </div>
              </div>
            ))}
            {history.length === 0 ? (
              <p className="text-sm text-zinc-500">No activity yet.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Record testing session</CardTitle>
          </CardHeader>
          <CardContent>
            <TestingSessionForm employeeId={employee.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}