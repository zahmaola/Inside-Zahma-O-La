import { ensureRequestRuntime } from "@/lib/request-runtime";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  getFeedback,
  findSimilarFeedback,
  listFeedbackAttachments,
} from "@/lib/data/feedback";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FeedbackStatusBadge } from "@/components/status-badge";
import { SeverityBadge } from "@/components/severity-badge";
import { FeedbackDetailActions } from "@/components/forms/feedback-detail-actions";
import { FeedbackAttachmentForm } from "@/components/forms/feedback-attachment-form";
import { labelCategory } from "@/lib/format-labels";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { isDemoMode } from "@/lib/demo/data";

export default async function FeedbackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await ensureRequestRuntime();
  const { id } = await params;
  const feedback = await getFeedback(id);
  if (!feedback) notFound();

  const [similar, attachments] = await Promise.all([
    findSimilarFeedback(feedback.title, feedback.employee_id, 0.55),
    listFeedbackAttachments(id),
  ]);
  const others = similar.filter((s) => s.id !== feedback.id);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="gap-2">
        <Link href="/feedback">
          <ArrowLeft className="h-4 w-4" />
          Back to feedback
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{feedback.title}</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {feedback.employees?.full_name ?? "Unknown"} ·{" "}
            {format(new Date(feedback.reported_at), "PPP")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <SeverityBadge severity={feedback.severity} />
            <FeedbackStatusBadge status={feedback.status} />
            <Badge variant="muted">{labelCategory(feedback.category)}</Badge>
            {feedback.validated ? <Badge variant="success">Validated</Badge> : null}
          </div>
        </div>
      </div>

      {others.length > 0 ? (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <CardTitle className="text-base">Similar reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {others.map((s) => (
              <Link
                key={s.id}
                href={`/feedback/${s.id}`}
                className="block text-sm text-amber-200 hover:underline"
              >
                {s.title} ({s.status})
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-zinc-300">
            <p>{feedback.description ?? "No description provided."}</p>
            {feedback.feature_module ? (
              <p>
                <span className="text-zinc-500">Module:</span> {feedback.feature_module}
              </p>
            ) : null}
            {feedback.departments?.name ? (
              <p>
                <span className="text-zinc-500">Department:</span> {feedback.departments.name}
              </p>
            ) : null}
            {feedback.admin_notes ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-zinc-400">
                <p className="text-xs uppercase text-zinc-500">Existing admin notes</p>
                <p className="mt-1">{feedback.admin_notes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin actions</CardTitle>
          </CardHeader>
          <CardContent>
            <FeedbackDetailActions feedback={feedback} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attachments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {attachments.length === 0 ? (
            <p className="text-sm text-zinc-500">
              {isDemoMode()
                ? "Attachment uploads require a connected Supabase project."
                : "No screenshots yet."}
            </p>
          ) : (
            <ul className="space-y-2">
              {attachments.map((file) => (
                <li key={file.id}>
                  {file.url ? (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-amber-300 underline-offset-4 hover:underline"
                    >
                      {file.file_name ?? file.storage_path}
                    </a>
                  ) : (
                    <span className="text-sm text-zinc-400">
                      {file.file_name ?? file.storage_path}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <FeedbackAttachmentForm feedbackId={id} />
        </CardContent>
      </Card>
    </div>
  );
}