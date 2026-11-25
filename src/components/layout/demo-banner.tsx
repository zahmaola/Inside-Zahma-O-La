import { AlertTriangle } from "lucide-react";

export function DemoModeBanner() {
  return (
    <div className="px-4 pt-4 md:px-6">
      <div className="glass-panel-soft flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm text-zinc-300">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400/80" />
        <span>Demo mode — connect Supabase to persist data</span>
      </div>
    </div>
  );
}
