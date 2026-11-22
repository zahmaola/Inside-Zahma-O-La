"use client";

import { useState, useTransition } from "react";
import {
  addAdminNotes,
  updateFeedback,
  validateFeedback,
} from "@/app/actions/feedback";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FEEDBACK_STATUSES, type Feedback, type FeedbackStatus } from "@/types/database";
import { useRouter } from "next/navigation";

export function FeedbackDetailActions({ feedback }: { feedback: Feedback }) {
  const [status, setStatus] = useState<FeedbackStatus>(feedback.status);
  const [notes, setNotes] = useState(feedback.admin_notes ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

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
      const result = await validateFeedback(feedback.id);
      setMessage(result.error ?? "Validated and points applied if eligible");
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
      {!feedback.validated ? (
        <Button type="button" variant="accent" disabled={pending} onClick={onValidate}>
          Validate feedback
        </Button>
      ) : (
        <p className="text-sm text-emerald-400">Validated · points {feedback.points_awarded ? "awarded" : "pending"}</p>
      )}
    </div>
  );
}