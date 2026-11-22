import {
  BarChart3,
  Bug,
  ClipboardList,
  LayoutDashboard,
  Settings,
  Target,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { title: "Overview", href: "/overview", icon: LayoutDashboard },
  { title: "Employees", href: "/employees", icon: Users },
  { title: "Feedback & Bugs", href: "/feedback", icon: Bug },
  { title: "Testing Missions", href: "/missions", icon: Target },
  { title: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Weekly Reports", href: "/reports", icon: ClipboardList },
  { title: "Settings", href: "/settings", icon: Settings },
];

export function getPageTitle(pathname: string) {
  const match = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return match?.title ?? "INSIDE ZAHMA";
}
