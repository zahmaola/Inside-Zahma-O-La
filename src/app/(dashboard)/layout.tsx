import type { ReactNode } from "react";
import { Suspense } from "react";
import { connection } from "next/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DemoModeBanner } from "@/components/layout/demo-banner";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { isDemoMode } from "@/lib/demo/data";
import { getCurrentAdmin } from "@/lib/auth";
import { listFeedback } from "@/lib/data/feedback";

/** Dashboard routes read live / demo data per request. */
export const instant = false;

async function DashboardChrome({ children }: { children: ReactNode }) {
  await connection();
  const [pending, adminCtx] = await Promise.all([
    listFeedback({ status: "new" }),
    getCurrentAdmin(),
  ]);

  const adminName =
    adminCtx?.admin?.display_name ??
    adminCtx?.user?.email?.split("@")[0] ??
    "Admin";

  return (
    <div className="flex min-h-screen flex-col bg-black lg:flex-row">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {isDemoMode() ? <DemoModeBanner /> : null}
        <Topbar pendingFeedback={pending.length} adminName={adminName} />
        <main className="flex-1 px-4 pb-10 pt-2 md:px-8">
          <Suspense fallback={<DashboardSkeleton />}>{children}</Suspense>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-black">
          <div className="hidden w-[240px] border-r border-white/10 lg:block" />
          <div className="flex-1 px-8 py-10">
            <DashboardSkeleton />
          </div>
        </div>
      }
    >
      <DashboardChrome>{children}</DashboardChrome>
    </Suspense>
  );
}
