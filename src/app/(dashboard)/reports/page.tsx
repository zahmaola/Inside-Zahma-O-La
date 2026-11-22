import { ensureRequestRuntime } from "@/lib/request-runtime";
import Link from "next/link";
import { format } from "date-fns";
import { listWeeklyReports } from "@/lib/data/reports";
import { SaveWeeklyReportButton } from "@/components/forms/save-weekly-report-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentWeekRange, toISODate, formatRangeLabel } from "@/lib/dates/week";
import { Presentation } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export default async function ReportsPage() {
  await ensureRequestRuntime();
  const reports = await listWeeklyReports();
  const { start, end } = getCurrentWeekRange();
  const periodStart = toISODate(start);
  const periodEnd = toISODate(end);
  const title = `Weekly report — ${formatRangeLabel(start, end)}`;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Thursday pack"
        title="Reports"
        description="Saved snapshots for leadership reviews"
        action={
          <SaveWeeklyReportButton
            title={title}
            periodStart={periodStart}
            periodEnd={periodEnd}
          />
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Saved reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reports.length === 0 ? (
            <p className="text-sm text-zinc-500">No reports yet. Generate this week&apos;s report above.</p>
          ) : (
            reports.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link href={`/reports/${r.id}`} className="font-medium text-white hover:text-amber-300">
                    {r.title}
                  </Link>
                  <p className="text-xs text-zinc-500">
                    {format(new Date(r.period_start), "MMM d")} –{" "}
                    {format(new Date(r.period_end), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" asChild>
                    <Link href={`/reports/${r.id}`}>View</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="gap-1">
                    <Link href={`/reports/${r.id}/present`}>
                      <Presentation className="h-3.5 w-3.5" />
                      Present
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}