"use client";

import { useState, useTransition } from "react";
import { createMission } from "@/app/actions/missions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import type { Department, MissionStatus } from "@/types/database";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toISODate, getCurrentWeekRange } from "@/lib/dates/week";

export function CreateMissionDialog({ departments }: { departments: Department[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<"all" | "department">("all");
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState<MissionStatus>("active");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { start, end } = getCurrentWeekRange();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: String(fd.get("title")),
      description: String(fd.get("description") ?? "") || null,
      feature_module: String(fd.get("feature_module") ?? "") || null,
      instructions: String(fd.get("instructions") ?? "") || null,
      start_date: String(fd.get("start_date")),
      end_date: String(fd.get("end_date")),
      scope,
      department_id: scope === "department" ? departmentId || null : null,
      status,
      points_available: Number(fd.get("points_available") ?? 10),
      completion_criteria: String(fd.get("completion_criteria") ?? "") || null,
    };
    startTransition(async () => {
      const result = await createMission(payload);
      if (result.error) setError(result.error);
      else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New mission
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create testing mission</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                defaultValue={toISODate(start)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End</Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                defaultValue={toISODate(end)}
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Scope</Label>
              <Select value={scope} onValueChange={(v) => setScope(v as "all" | "department")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Company-wide</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as MissionStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["draft", "upcoming", "active", "completed", "cancelled"].map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {scope === "department" ? (
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="points_available">Points available</Label>
            <Input id="points_available" name="points_available" type="number" defaultValue={10} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea id="instructions" name="instructions" rows={3} />
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Creating…" : "Create mission"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}