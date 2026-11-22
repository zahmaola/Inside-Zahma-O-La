import { ensureRequestRuntime } from "@/lib/request-runtime";
import { Suspense } from "react";
import { getAnalytics } from "@/lib/data/analytics";
import { AnalyticsCharts } from "@/components/charts/analytics-charts";
import { AnalyticsPreset } from "@/components/forms/analytics-preset";
import { StatCard } from "@/components/ui/stat-card";
import type { DateRangePreset } from "@/lib/dates/week";
import { formatPercent } from "@/lib/utils";
import { formatRangeLabel, resolveDateRange } from "@/lib/dates/week";
import { PageHeader } from "@/components/layout/page-header";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string }>;
}) {
  await ensureRequestRuntime();
  const { preset: presetParam } = await searchParams;
  const preset = (presetParam as DateRangePreset) ?? "this_week";
  const data = await getAnalytics(preset);
  const range = resolveDateRange(preset);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Insights"
        title="Analytics"
        description={formatRangeLabel(range.start, range.end)}
        action={
          <Suspense fallback={null}>
            <AnalyticsPreset preset={preset} />
          </Suspense>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Participation rate"
          value={formatPercent(data.participation.participationRate)}
          hint={`${data.participation.participatingEmployees}/${data.participation.activeEmployees} active`}
        />
        <StatCard label="Sessions" value={data.participation.sessionsCount} />
        <StatCard label="Feedback" value={data.participation.feedbackCount} />
        <StatCard label="Range" value={data.range.start.slice(5)} hint={`to ${data.range.end}`} />
      </div>

      <AnalyticsCharts data={data} />
    </div>
  );
}