import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AttendanceSummary } from "../dashboardData";
import { PanelEmpty, PanelError } from "./PanelState";

interface AttendanceChartProps {
  summary: AttendanceSummary;
  error?: string;
  onRetry: () => void;
  className?: string;
}

const ATTENDANCE_COLORS = {
  present: "#10b981",
  late: "#f59e0b",
  onLeave: "#3b82f6",
  absent: "#94a3b8",
};

export function AttendanceChart({ summary, error, onRetry, className }: AttendanceChartProps) {
  const legendData = [
    { name: "Present", value: summary.present, color: ATTENDANCE_COLORS.present },
    { name: "Late", value: summary.late, color: ATTENDANCE_COLORS.late },
    { name: "On leave", value: summary.onLeave, color: ATTENDANCE_COLORS.onLeave },
    { name: "Not clocked in", value: summary.absent, color: ATTENDANCE_COLORS.absent },
  ];
  const chartData = legendData.filter((entry) => entry.value > 0);
  const hasClockIns = summary.recorded > 0;
  const emptyMessage =
    summary.onLeave > 0
      ? `No clock-ins recorded today yet. ${summary.onLeave} ${
          summary.onLeave === 1 ? "employee is" : "employees are"
        } on approved leave.`
      : "No clock-ins recorded today yet.";

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Today's attendance</CardTitle>
          <CardDescription>Clock-ins recorded today</CardDescription>
        </div>
        <Badge variant="outline">
          {hasClockIns ? `${summary.recorded} recorded` : "No records"}
        </Badge>
      </CardHeader>
      <CardContent>
        {error ? (
          <PanelError message={error} onRetry={onRetry} />
        ) : !hasClockIns ? (
          <PanelEmpty message={emptyMessage} />
        ) : (
          <>
            <div className="relative">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={64}
                    outerRadius={96}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      borderColor: "var(--border)",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-semibold tracking-tight tabular-nums">
                  {summary.rate}%
                </span>
                <span className="text-xs text-muted-foreground">attendance</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {legendData.map((entry) => (
                <div key={entry.name} className="rounded-lg bg-muted/50 px-2 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs text-muted-foreground">{entry.name}</span>
                  </div>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{entry.value}</p>
                </div>
              ))}
            </div>
            {summary.hoursWorked > 0 ? (
              <p className="mt-4 text-xs text-muted-foreground">
                {summary.hoursWorked.toLocaleString(undefined, { maximumFractionDigits: 1 })} hours
                logged today
                {summary.lateMinutes > 0
                  ? `, with ${summary.lateMinutes} late minutes`
                  : ""}
                .
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
