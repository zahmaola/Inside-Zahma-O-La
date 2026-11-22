"use client";

import { useState, useTransition } from "react";
import { recordParticipation } from "@/app/actions/missions";
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
import type { Employee } from "@/types/database";
import { useRouter } from "next/navigation";

export function RecordParticipationForm({
  missionId,
  employees,
}: {
  missionId: string;
  employees: Employee[];
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [validated, setValidated] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (!employeeId) {
      setError("Select an employee");
      return;
    }
    const payload = {
      mission_id: missionId,
      employee_id: employeeId,
      validated,
      admin_notes: String(fd.get("admin_notes") ?? "") || null,
    };
    startTransition(async () => {
      const result = await recordParticipation(payload);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <div className="space-y-2">
        <Label>Employee</Label>
        <Select value={employeeId} onValueChange={setEmployeeId}>
          <SelectTrigger>
            <SelectValue placeholder="Select employee" />
          </SelectTrigger>
          <SelectContent>
            {employees
              .filter((e) => e.status === "active")
              .map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.full_name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-400">
        <input
          type="checkbox"
          checked={validated}
          onChange={(e) => setValidated(e.target.checked)}
          className="rounded border-white/20"
        />
        Mark validated (award points)
      </label>
      <div className="space-y-2">
        <Label htmlFor="admin_notes">Notes</Label>
        <Textarea id="admin_notes" name="admin_notes" rows={2} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Record participation"}
      </Button>
    </form>
  );
}