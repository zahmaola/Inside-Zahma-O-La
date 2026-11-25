import { getSettings } from "@/lib/data/settings";
import { SettingsForms } from "@/components/forms/settings-forms";
import { PageHeader } from "@/components/layout/page-header";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Settings"
        description="Campaign configuration and point rules"
      />
      <SettingsForms settings={settings} />
    </div>
  );
}