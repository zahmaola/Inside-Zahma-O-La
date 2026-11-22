import { ensureRequestRuntime } from "@/lib/request-runtime";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getWeeklyReport, type WeeklyReportPayload } from "@/lib/data/reports";
import { formatNumber, formatPercent } from "@/lib/utils";
import { X } from "lucide-react";

export default async function ReportPresentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await ensureRequestRuntime();
  const { id } = await params;
  const report = await getWeeklyReport(id);
  if (!report) notFound();

  const payload = report.payload as WeeklyReportPayload;
  const bugs = payload.bugs_by_severity ?? {};

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen flex-col bg-[#0A0A0A] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.15),_transparent_60%)]" />
      <Link
        href={`/reports/${id}`}
        className="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-zinc-400 hover:text-white"
        aria-label="Exit presentation"
      >
        <X className="h-5 w-5" />
      </Link>

      <div className="relative flex flex-1 flex-col justify-center px-8 py-16 md:px-20">
        <p className="text-sm uppercase tracking-[0.35em] text-amber-400/90">INSIDE ZAHMA</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">
          {report.title}
        </h1>
        <p className="mt-4 text-xl text-zinc-400">
          {format(new Date(report.period_start), "MMMM d")} –{" "}
          {format(new Date(report.period_end), "MMMM d, yyyy")}
        </p>

        <div className="mt-16 grid max-w-5xl gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <div>
              <p className="text-6xl font-semibold text-amber-400 md:text-7xl">
                {formatPercent(payload.participation_rate)}
              </p>
              <p className="mt-2 text-lg text-zinc-500">Team participation</p>
            </div>
            <div className="grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
              <div>
                <p className="text-3xl font-semibold">{payload.feedback_count}</p>
                <p className="text-sm text-zinc-500">Feedback</p>
              </div>
              <div>
                <p className="text-3xl font-semibold">{payload.sessions_count}</p>
                <p className="text-sm text-zinc-500">Sessions</p>
              </div>
              <div>
                <p className="text-3xl font-semibold">{formatNumber(payload.points_awarded)}</p>
                <p className="text-sm text-zinc-500">Points</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <p className="text-sm uppercase tracking-widest text-zinc-500">Top contributors</p>
            <ul className="mt-6 space-y-4">
              {payload.top_contributors?.map((c, i) => (
                <li key={c.employee_id} className="flex items-baseline justify-between gap-4">
                  <span className="text-2xl text-amber-500/80">#{i + 1}</span>
                  <span className="flex-1 text-xl">{c.full_name}</span>
                  <span className="text-lg text-amber-300">{formatNumber(c.points)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-sm text-zinc-500">
              Open bugs — critical {bugs.critical ?? 0}, high {bugs.high ?? 0}, medium{" "}
              {bugs.medium ?? 0}, low {bugs.low ?? 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}