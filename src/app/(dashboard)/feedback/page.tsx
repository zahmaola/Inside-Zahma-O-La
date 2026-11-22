import { ensureRequestRuntime } from "@/lib/request-runtime";
import Link from "next/link";
import { format } from "date-fns";
import { listFeedback } from "@/lib/data/feedback";
import { listEmployees } from "@/lib/data/employees";
import { CreateFeedbackDialog } from "@/components/forms/create-feedback-dialog";
import { FeedbackFilters } from "@/components/forms/feedback-filters";
import { Card, CardContent } from "@/components/ui/card";
import { FeedbackStatusBadge } from "@/components/status-badge";
import { SeverityBadge } from "@/components/severity-badge";
import { labelCategory } from "@/lib/format-labels";
import type {
  FeedbackCategory,
  FeedbackSeverity,
  FeedbackStatus,
} from "@/types/database";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    severity?: string;
    category?: string;
  }>;
}) {
  await ensureRequestRuntime();
  const { q, status, severity, category } = await searchParams;

  const filters = {
    search: q,
    status: status as FeedbackStatus | undefined,
    severity: severity as FeedbackSeverity | undefined,
    category: category as FeedbackCategory | undefined,
  };

  const [items, employees] = await Promise.all([
    listFeedback(filters),
    listEmployees(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Tracker"
        title="Feedback"
        description={`${items.length} items logged`}
        action={
          <CreateFeedbackDialog
            employees={employees.filter((e) => e.status === "active")}
          />
        }
      />

      <Suspense fallback={null}>
        <FeedbackFilters q={q} status={status} severity={severity} category={category} />
      </Suspense>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Category</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Reporter</th>
                <th className="px-4 py-3 font-medium">Reported</th>
              </tr>
            </thead>
            <tbody>
              {items.map((f) => (
                <tr key={f.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <Link
                      href={`/feedback/${f.id}`}
                      className="font-medium text-white hover:text-amber-300"
                    >
                      {f.title}
                    </Link>
                    {f.feature_module ? (
                      <p className="text-xs text-zinc-600">{f.feature_module}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={f.severity} />
                  </td>
                  <td className="px-4 py-3">
                    <FeedbackStatusBadge status={f.status} />
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-400 md:table-cell">
                    {labelCategory(f.category)}
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-400 lg:table-cell">
                    {f.employees?.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {format(new Date(f.reported_at), "MMM d, yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}