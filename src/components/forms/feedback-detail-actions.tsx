"use client";

import { useState, useTransition } from "react";
import {
  addAdminNotes,
  markFeedbackInvalid,
  updateFeedback,
  validateFeedback,
} from "@/app/actions/feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FEEDBACK_SEVERITIES,
  FEEDBACK_STATUSES,
  type Feedback,
  type FeedbackSeverity,
  type FeedbackStatus,
  type PointRules,
} from "@/types/database";
import { pointsForFeedback } from "@/lib/points/rules";
import { useRouter } from "next/navigation";

export function FeedbackDetailActions({
  feedback,
  rules,
  employeeName,
}: {
  feedback: Feedback;
  rules: PointRules;
  employeeName?: string | null;
}) {
  const [status, setStatus] = useState<FeedbackStatus>(feedback.status);
  const [severity, setSeverity] = useState<FeedbackSeverity>(feedback.severity);
  const [override, setOverride] = useState("");
  const [notes, setNotes] = useState(feedback.admin_notes ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const isSuggestion = feedback.category === "feature_suggestion";
  const suggestedPoints = pointsForFeedback(feedback.category, severity, rules);
  const overrideValue = override.trim() === "" ? undefined : Number(override);
  const finalPoints =
    overrideValue !== undefined && Number.isFinite(overrideValue)
      ? overrideValue
      : suggestedPoints;
  const hasEmployee = Boolean(feedback.employee_id);

  function saveStatus() {
    startTransition(async () => {
      const result = await updateFeedback(feedback.id, { status });
      setMessage(result.error ?? "Status updated");
      router.refresh();
    });
  }

  function saveNotes() {
    startTransition(async () => {
      const result = await addAdminNotes({ id: feedback.id, admin_notes: notes });
      setMessage(result.error ?? "Notes saved");
      router.refresh();
    });
  }

  function onValidate() {
    startTransition(async () => {
      const result = await validateFeedback(feedback.id, {
        severity,
        ...(overrideValue !== undefined && Number.isFinite(overrideValue)
          ? { points_override: overrideValue }
          : {}),
      });
      setMessage(
        result.error ??
          (hasEmployee && finalPoints > 0
            ? `Validated — ${finalPoints} points awarded to ${employeeName ?? "the reporter"}`
            : "Validated"),
      );
      router.refresh();
    });
  }

  function onInvalid() {
    startTransition(async () => {
      const result = await markFeedbackInvalid(feedback.id);
      setMessage(result.error ?? "Marked invalid / duplicate — no points awarded");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {message ? <p className="text-sm text-amber-200">{message}</p> : null}

      <div className="space-y-2">
        <Label>Status</Label>
        <div className="flex gap-2">
          <Select value={status} onValueChange={(v) => setStatus(v as FeedbackStatus)}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FEEDBACK_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="secondary" disabled={pending} onClick={saveStatus}>
            Update
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin_notes">Admin notes</Label>
        <Textarea
          id="admin_notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
        />
        <Button type="button" variant="secondary" disabled={pending} onClick={saveNotes}>
          Save notes
        </Button>
      </div>

      <div className="glass-panel-soft space-y-4 rounded-2xl p-4">
        <div>
          <p className="text-sm font-medium text-white">Validation &amp; points</p>
          <p className="mt-1 text-xs text-zinc-500">
            Points are only awarded when you validate. Reviewing a report never
            awards points by itself.
          </p>
        </div>

        {feedback.validated ? (
          <p className="text-sm text-emerald-400">
            Validated ·{" "}
            {feedback.points_awarded
              ? "points awarded"
              : hasEmployee
                ? "no points awarded"
                : "no reporter linked"}
          </p>
        ) : (
          <>
            {feedback.is_duplicate ? (
              <p className="text-sm text-red-300">
                Marked invalid / duplicate. You can still validate it to override.
              </p>
            ) : null}

            {!isSuggestion ? (
              <div className="space-y-2">
                <Label>Severity (adjust if needed)</Label>
                <Select
                  value={severity}
                  onValueChange={(v) => setSeverity(v as FeedbackSeverity)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FEEDBACK_SEVERITIES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="points_override">
                Custom points (optional — default {suggestedPoints})
              </Label>
              <Input
                id="points_override"
                type="number"
                min={0}
                placeholder={String(suggestedPoints)}
                value={override}
                onChange={(e) => setOverride(e.target.value)}
              />
            </div>

            <p className="text-sm text-zinc-300">
              {hasEmployee ? (
                <>
                  Awards{" "}
                  <span className="font-medium text-white">{finalPoints} pts</span>{" "}
                  to {employeeName ?? "the reporter"}
                </>
              ) : (
                "No employee is linked to this report, so no points will be awarded."
              )}
            </p>

            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={pending} onClick={onValidate}>
                Validate &amp; award points
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={onInvalid}
              >
                Mark invalid / duplicate
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
