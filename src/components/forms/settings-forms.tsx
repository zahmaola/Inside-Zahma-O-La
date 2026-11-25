"use client";

import { useState, useTransition } from "react";
import { updateSettings, upsertDepartment } from "@/app/actions/settings";
import type { AppSettings } from "@/lib/data/settings";
import type { PointRules } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

const RULE_FIELDS: { key: keyof PointRules; label: string }[] = [
  { key: "critical_bug", label: "Critical issue" },
  { key: "high_priority_bug", label: "High severity issue" },
  { key: "medium_bug", label: "Medium severity issue" },
  { key: "low_bug", label: "Low severity issue" },
  { key: "useful_suggestion", label: "Useful suggestion" },
  { key: "completed_mission", label: "Completed mission" },
  { key: "documented_session", label: "Documented session" },
  { key: "duplicate_or_invalid", label: "Duplicate / invalid" },
];

export function SettingsForms({ settings }: { settings: AppSettings }) {
  const [campaignName, setCampaignName] = useState(settings.campaign_name);
  const [rules, setRules] = useState<PointRules>(settings.point_rules);
  const [deptName, setDeptName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await updateSettings({
        campaign_name: campaignName,
        point_rules: rules,
      });
      setMessage(result.error ?? "Settings saved");
      router.refresh();
    });
  }

  function addDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!deptName.trim()) return;
    setMessage(null);
    startTransition(async () => {
      const result = await upsertDepartment({ name: deptName.trim() });
      if (result.error) setMessage(result.error);
      else {
        setDeptName("");
        setMessage("Department saved");
        router.refresh();
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Campaign & points</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveSettings} className="space-y-4">
            {message ? <p className="text-sm text-amber-200">{message}</p> : null}
            <div className="space-y-2">
              <Label htmlFor="campaign_name">Campaign name</Label>
              <Input
                id="campaign_name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {RULE_FIELDS.map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label className="text-xs">{field.label}</Label>
                  <Input
                    type="number"
                    value={rules[field.key]}
                    onChange={(e) =>
                      setRules((r) => ({
                        ...r,
                        [field.key]: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              ))}
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save settings"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Departments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="flex flex-wrap gap-2">
            {settings.departments.map((d) => (
              <li key={d.id}>
                <Badge variant={d.active ? "default" : "muted"}>{d.name}</Badge>
              </li>
            ))}
          </ul>
          <form onSubmit={addDepartment} className="flex gap-2">
            <Input
              placeholder="New department name"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
            />
            <Button type="submit" variant="secondary" disabled={pending}>
              Add
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}