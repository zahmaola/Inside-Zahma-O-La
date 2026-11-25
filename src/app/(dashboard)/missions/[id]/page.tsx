import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getMission } from "@/lib/data/missions";
import { listEmployees } from "@/lib/data/employees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MissionStatusBadge } from "@/components/status-badge";
import { RecordParticipationForm } from "@/components/forms/record-participation-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function MissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [mission, employees] = await Promise.all([
    getMission(id),
    listEmployees(),
  ]);
  if (!mission) notFound();

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="gap-2">
        <Link href="/missions">
          <ArrowLeft className="h-4 w-4" />
          Back to missions
        </Link>
      </Button>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-white">{mission.title}</h1>
          <MissionStatusBadge status={mission.status} />
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          {format(new Date(mission.start_date), "MMM d")} –{" "}
          {format(new Date(mission.end_date), "MMM d, yyyy")} · {mission.points_available} pts
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Brief</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-zinc-300">
            <p>{mission.description ?? "No description."}</p>
            {mission.instructions ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs uppercase text-zinc-500">Instructions</p>
                <p className="mt-1 whitespace-pre-wrap">{mission.instructions}</p>
              </div>
            ) : null}
            {mission.completion_criteria ? (
              <p>
                <span className="text-zinc-500">Completion:</span> {mission.completion_criteria}
              </p>
            ) : null}
            <p>
              <span className="text-zinc-500">Scope:</span>{" "}
              {mission.scope === "department"
                ? mission.departments?.name ?? "Department"
                : "Company-wide"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Record participation</CardTitle>
          </CardHeader>
          <CardContent>
            <RecordParticipationForm missionId={mission.id} employees={employees} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}