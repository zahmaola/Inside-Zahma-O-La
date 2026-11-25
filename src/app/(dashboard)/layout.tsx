import type { ReactNode } from "react";
import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DemoModeBanner } from "@/components/layout/demo-banner";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { isDemoMode } from "@/lib/demo/data";
import { getCurrentAdmin } from "@/lib/auth";
import { getPendingFeedbackCount } from "@/lib/data/feedback";

async function SidebarSlot() {
  const adminCtx = await getCurrentAdmin();
  const adminName =
    adminCtx?.admin?.display_name ??
    adminCtx?.user?.email?.split("@")[0] ??
    "Admin";
  return <Sidebar adminName={adminName} />;
}

async function TopbarSlot() {
  const [pending, adminCtx] = await Promise.all([
    getPendingFeedbackCount(),
    getCurrentAdmin(),
  ]);
  const adminName =
    adminCtx?.admin?.display_name ??
    adminCtx?.user?.email?.split("@")[0] ??
    "Admin";
  return <Topbar pendingFeedback={pending} adminName={adminName} />;
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="dashboard-atmosphere">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-4 p-3 md:p-4 lg:gap-5 lg:p-5">
        <Suspense
          fallback={
            <aside className="glass-panel hidden w-[260px] shrink-0 rounded-[28px] lg:block" />
          }
        >
          <SidebarSlot />
        </Suspense>

        <div className="glass-panel flex min-h-[calc(100vh-2.5rem)] min-w-0 flex-1 flex-col rounded-[28px]">
          {isDemoMode() ? <DemoModeBanner /> : null}
          <div className="px-4 pt-4 md:px-6 md:pt-5">
            <Suspense
              fallback={
                <div className="glass-panel-soft h-12 animate-pulse rounded-full" />
              }
            >
              <TopbarSlot />
            </Suspense>
          </div>
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            <Suspense fallback={<DashboardSkeleton />}>{children}</Suspense>
          </main>
        </div>
      </div>
      <Suspense fallback={null}>
        <MobileNav />
      </Suspense>
    </div>
  );
}
