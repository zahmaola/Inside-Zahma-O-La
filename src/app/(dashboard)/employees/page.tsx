import Link from "next/link";
import { listEmployees } from "@/lib/data/employees";
import { getSettings } from "@/lib/data/settings";
import { AddEmployeeDialog } from "@/components/forms/add-employee-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmployeeStatusBadge } from "@/components/status-badge";
import { initials } from "@/lib/utils";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [employees, settings] = await Promise.all([
    listEmployees(q),
    getSettings(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Directory"
        title="Employees"
        description={`${employees.length} people in the roster`}
        action={<AddEmployeeDialog departments={settings.departments} />}
      />

      <form className="relative max-w-md" method="get" action="/employees">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search by name or title…"
          className="pl-9"
        />
      </form>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Department</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr
                  key={emp.id}
                  className="border-b border-white/5 transition hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/employees/${emp.id}`}
                      className="flex items-center gap-3 text-white hover:text-amber-300"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-medium">
                        {initials(emp.full_name)}
                      </span>
                      {emp.full_name}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-400 md:table-cell">
                    {emp.departments?.name ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-400 lg:table-cell">
                    {emp.job_title ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <EmployeeStatusBadge status={emp.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}