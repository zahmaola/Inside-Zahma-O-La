"use client";

import { useState, useTransition } from "react";
import { createTestingSession } from "@/app/actions/employees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { toISODate } from "@/lib/dates/week";

export function TestingSessionForm({ employeeId }: { employeeId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      employee_id: employeeId,
      session_date: String(fd.get("session_date")),
      feature_module: String(fd.get("feature_module") ?? "") || null,
      notes: String(fd.get("notes") ?? "") || null,
      award_points: fd.get("award_points") === "on",
    };
    startTransition(async () => {
      const result = await createTestingSession(payload);
      if (result.error) setError(result.error);
      else {
        e.currentTarget.reset();
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <div className="space-y-2">
        <Label htmlFor="session_date">Session date</Label>
        <Input
          id="session_date"
          name="session_date"
          type="date"
          defaultValue={toISODate(new Date())}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="feature_module">Feature / module</Label>
        <Input id="feature_module" name="feature_module" placeholder="e.g. Registration" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-400">
        <input
          type="checkbox"
          name="award_points"
          defaultChecked
          className="rounded border-white/20"
        />
        Award documented session points
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Recording…" : "Record session"}
      </Button>
    </form>
  );
}