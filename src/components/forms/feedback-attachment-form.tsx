"use client";

import { useState, useTransition } from "react";
import { uploadFeedbackAttachment } from "@/app/actions/feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FeedbackAttachmentForm({ feedbackId }: { feedbackId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        setError(null);
        setSuccess(false);
        startTransition(async () => {
          const result = await uploadFeedbackAttachment(feedbackId, formData);
          if (result.error) {
            setError(result.error);
            return;
          }
          setSuccess(true);
          form.reset();
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="file">Screenshot / attachment</Label>
        <Input id="file" name="file" type="file" accept="image/*,.pdf" required />
      </div>
      {error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : null}
      {success ? (
        <p className="text-sm text-emerald-300">Attachment uploaded.</p>
      ) : null}
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Uploading…" : "Upload"}
      </Button>
    </form>
  );
}
