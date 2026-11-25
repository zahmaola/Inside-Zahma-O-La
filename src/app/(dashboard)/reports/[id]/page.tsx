import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getWeeklyReport, type WeeklyReportPayload } from "@/lib/data/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNumber, formatPercent } from "@/lib/utils";
import { ArrowLeft, Presentation } from "lucide-react";
import { PrintReportButton } from "@/components/forms/print-report-button";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getWeeklyReport(id);
  if (!report) notFound();

  const payload = report.payload as WeeklyReportPayload;

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/reports">
            <ArrowLeft className="h-4 w-4" />
            Reports
          </Link>
        </Button>
        <PrintReportButton />
        <Button variant="outline" size="sm" asChild className="gap-2">
          <Link href={`/reports/${id}/present`}>
            <Presentation className="h-4 w-4" />
            Presentation
          </Link>
        </Button>
      </div>

      <div className="print-card rounded-2xl border border-white/10 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">INSIDE ZAHMA</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{report.title}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {format(new Date(report.period_start), "MMMM d")} –{" "}
          {format(new Date(report.period_end), "MMMM d, yyyy")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ["Participation", formatPercent(payload.participation_rate)],
            ["Feedback", String(payload.feedback_count)],
            ["Sessions", String(payload.sessions_count)],
            ["Points", formatNumber(payload.points_awarded)],
          ] as const
        ).map(([label, value]) => (
          <Card key={label} className="print-card">
            <CardContent className="p-4">
              <p className="text-xs uppercase text-zinc-500">{label}</p>
              <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="print-card">
        <CardHeader>
          <CardTitle>Top contributors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {payload.top_contributors?.map((c, i) => (
            <div key={c.employee_id} className="flex justify-between text-sm">
              <span className="text-zinc-300">
                #{i + 1} {c.full_name}
              </span>
              <span className="text-amber-400">{formatNumber(c.points)} pts</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {report.next_week_priorities ? (
        <Card className="print-card">
          <CardHeader>
            <CardTitle>Next week priorities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-zinc-300">{report.next_week_priorities}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}