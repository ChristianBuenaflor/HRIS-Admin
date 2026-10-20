import { ClipboardCheck, Clock3, Users, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { DashboardSnapshot } from "../api";
import { hasRouteAccess } from "@/utils/role";
import { cn } from "@/lib/utils";

interface KpiStripProps {
  snapshot: DashboardSnapshot;
}

interface KpiItem {
  label: string;
  value: string;
  detail: string;
  icon: typeof Users;
  to: string;
  tone?: "default" | "attention";
}

const countLabel = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

export function KpiStrip({ snapshot }: KpiStripProps) {
  const navigate = useNavigate();
  const { attendance, approvals, payroll, errors } = snapshot;
  const hasAttendance = attendance.recorded > 0;
  const employeeDetail =
    snapshot.inactiveEmployees === null
      ? `${snapshot.activeEmployees} active · inactive count unavailable`
      : `${snapshot.activeEmployees} active, ${snapshot.inactiveEmployees} inactive`;
  const attendanceDetail = errors.attendance
    ? "Attendance data unavailable"
    : hasAttendance
      ? `${attendance.present} present, ${attendance.late} late${
          attendance.onLeave > 0 ? `, ${attendance.onLeave} on leave` : ""
        }${attendance.absent > 0 ? `, ${attendance.absent} not clocked in` : ""}`
      : attendance.onLeave > 0
        ? `No clock-ins recorded · ${attendance.onLeave} on approved leave`
        : "No clock-ins recorded today";

  const items: KpiItem[] = [
    {
      label: "Employees",
      value: snapshot.totalEmployees.toLocaleString(),
      detail: employeeDetail,
      icon: Users,
      to: "/employees",
    },
    {
      label: "Pending approvals",
      value: approvals.total.toLocaleString(),
      detail: errors.approvals
        ? "Approval data unavailable"
        : `${countLabel(approvals.leaves, "leave")}, ${countLabel(
            approvals.overtime,
            "overtime",
          )}, ${countLabel(approvals.loans, "loan")}`,
      icon: ClipboardCheck,
      to: "/attendance-leaving",
      tone: approvals.total > 0 ? "attention" : "default",
    },
    {
      label: "Attendance rate",
      value: errors.attendance || !hasAttendance ? "—" : `${attendance.rate}%`,
      detail: attendanceDetail,
      icon: Clock3,
      to: "/attendance-calendar",
    },
    {
      label: "Payroll periods",
      value: `${payroll.processed}/${payroll.totalPeriods}`,
      detail: errors.payroll
        ? "Payroll data unavailable"
        : `${countLabel(payroll.drafts, "draft")}, ${countLabel(
            payroll.activeEmployees,
            "active employee",
          )}`,
      icon: Wallet,
      to: "/payroll",
    },
  ];

  return (
    <div className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const canOpen = hasRouteAccess(item.to);
        return (
          <button
            key={item.label}
            type="button"
            disabled={!canOpen}
            onClick={() => navigate(item.to)}
            className="flex h-full flex-col justify-between gap-4 bg-card p-5 text-left transition-colors enabled:hover:bg-muted/40 disabled:cursor-default"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
              <span className="rounded-md bg-muted p-2 text-muted-foreground">
                <item.icon className="h-4 w-4" />
              </span>
            </div>
            <div>
              <p
                className={cn(
                  "text-3xl font-semibold tracking-tight tabular-nums",
                  item.tone === "attention" && "text-amber-600",
                )}
              >
                {item.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
