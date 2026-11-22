"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsResult } from "@/lib/data/analytics";
import { labelCategory } from "@/lib/format-labels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AMBER = "#f59e0b";
const PIE_COLORS = ["#f59e0b", "#b45309", "#d97706", "#78716c", "#a8a29e", "#57534e"];

const chartTooltipStyle = {
  backgroundColor: "#0a0a0a",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  color: "#fafafa",
};

export function AnalyticsCharts({ data }: { data: AnalyticsResult }) {
  const categoryData = data.feedbackByCategory.map((d) => ({
    name: labelCategory(d.name),
    value: d.value,
  }));
  const severityData = data.feedbackBySeverity.map((d) => ({
    name: d.name,
    value: d.value,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Engagement over time</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.engagementSeries}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" stroke="#71717a" fontSize={12} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Line type="monotone" dataKey="sessions" stroke={AMBER} strokeWidth={2} dot={false} name="Sessions" />
              <Line type="monotone" dataKey="feedback" stroke="#fbbf24" strokeWidth={2} dot={false} name="Feedback" />
              <Line type="monotone" dataKey="points" stroke="#b45309" strokeWidth={2} dot={false} name="Points" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feedback by category</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="value" fill={AMBER} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feedback by severity</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={severityData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {severityData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}