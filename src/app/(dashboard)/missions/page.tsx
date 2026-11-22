import { ensureRequestRuntime } from "@/lib/request-runtime";
import Link from "next/link";
import { format } from "date-fns";
import { listMissions } from "@/lib/data/missions";
import { getSettings } from "@/lib/data/settings";
import { CreateMissionDialog } from "@/components/forms/create-mission-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MissionStatusBadge } from "@/components/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MissionStatus, TestingMission } from "@/types/database";
import { PageHeader } from "@/components/layout/page-header";

const SECTIONS: MissionStatus[] = ["active", "upcoming", "completed"];

function MissionCards({ missions }: { missions: TestingMission[] }) {
  if (missions.length === 0) {
    return <p className="text-sm text-zinc-500">No missions in this section.</p>;
  }
  return (
    <div className="space-y-3">
      {missions.map((m) => (
        <Link
          key={m.id}
          href={`/missions/${m.id}`}
          className="block border-b border-white/10 px-1 py-4 transition hover:bg-white/[0.02] last:border-0"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-medium text-white">{m.title}</h3>
            <MissionStatusBadge status={m.status} />
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {format(new Date(m.start_date), "MMM d")} – {format(new Date(m.end_date), "MMM d, yyyy")}
            {m.feature_module ? ` · ${m.feature_module}` : ""}
          </p>
          <p className="mt-2 text-xs text-zinc-400">{m.points_available} points</p>
        </Link>
      ))}
    </div>
  );
}

export default async function MissionsPage() {
  await ensureRequestRuntime();
  const [settings, active, upcoming, completed] = await Promise.all([
    getSettings(),
    listMissions("active"),
    listMissions("upcoming"),
    listMissions("completed"),
  ]);

  const byStatus: Record<string, TestingMission[]> = {
    active,
    upcoming,
    completed,
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Campaigns"
        title="Missions"
        description="Focused testing campaigns for the team"
        action={<CreateMissionDialog departments={settings.departments} />}
      />

      <Tabs defaultValue="active">
        <TabsList>
          {SECTIONS.map((key) => (
            <TabsTrigger key={key} value={key} className="capitalize">
              {key}
            </TabsTrigger>
          ))}
        </TabsList>
        {SECTIONS.map((key) => (
          <TabsContent key={key} value={key}>
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">{key} missions</CardTitle>
              </CardHeader>
              <CardContent>
                <MissionCards missions={byStatus[key]} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}