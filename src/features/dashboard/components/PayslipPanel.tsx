import { Megaphone, Wallet } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PayslipSummary } from "../dashboardData";
import {
  buildPayslipChartData,
  formatPayslipCompactCurrency,
  formatPayslipCurrency,
  formatPayslipDate,
  getPayslipAnnouncement,
} from "../payslipDisplay";
import { PanelEmpty, PanelError, ViewAllLink } from "./PanelState";

interface PayslipPanelProps {
  summary: PayslipSummary;
  error?: string;
  onRetry: () => void;
  className?: string;
}

export function PayslipPanel({ summary, error, onRetry, className }: PayslipPanelProps) {
  const announcement = getPayslipAnnouncement(summary);
  const rows = buildPayslipChartData(summary.history);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Payslip announcements</CardTitle>
          <CardDescription>Latest payroll release and net-pay trend</CardDescription>
        </div>
        <ViewAllLink to="/payroll" label="Open payroll" />
      </CardHeader>
      <CardContent>
        {error ? (
          <PanelError message={error} onRetry={onRetry} />
        ) : !announcement ? (
          <PanelEmpty message="No payroll periods yet. Process a payroll period to announce payslips." />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <section
              aria-label="Latest payslip announcement"
              className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-background to-background p-5"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-primary">
                <Megaphone className="h-4 w-4" />
                {announcement.released ? "Payslips released" : "Payslip run in progress"}
              </div>
              <h3 className="mt-3 text-lg font-semibold tracking-tight">
                {announcement.period.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {announcement.released ? "Released" : "Pay date"}{" "}
                {formatPayslipDate(announcement.period.payDate)}
                {announcement.period.employeeCount > 0
                  ? ` · ${announcement.period.employeeCount} employees`
                  : ""}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="col-span-2 rounded-lg border bg-background/80 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Wallet className="h-3.5 w-3.5" />
                    Total net pay
                  </div>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {formatPayslipCurrency(announcement.period.netPay)}
                  </p>
                </div>
                <div className="rounded-lg bg-background/60 p-3">
                  <p className="text-xs text-muted-foreground">Gross</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums">
                    {formatPayslipCurrency(announcement.period.grossPay)}
                  </p>
                </div>
                <div className="rounded-lg bg-background/60 p-3">
                  <p className="text-xs text-muted-foreground">Deductions</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums">
                    {formatPayslipCurrency(announcement.period.deductions)}
                  </p>
                </div>
              </div>

              {announcement.released && summary.latestDraft ? (
                <p className="mt-4 text-xs text-muted-foreground">
                  Draft in progress: {summary.latestDraft.name}
                  {summary.latestDraft.payDate
                    ? ` · pay date ${formatPayslipDate(summary.latestDraft.payDate)}`
                    : ""}
                </p>
              ) : null}
            </section>

            <section aria-label="Net pay by payroll period" className="min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium">Net pay by period</h3>
                  <p className="text-xs text-muted-foreground">
                    Processed payslips, oldest to newest
                  </p>
                </div>
                {rows.length > 0 ? (
                  <Badge variant="outline">
                    {rows.length} {rows.length === 1 ? "period" : "periods"}
                  </Badge>
                ) : null}
              </div>

              {rows.length === 0 ? (
                <PanelEmpty message="No processed payroll periods to chart yet." />
              ) : (
                <div
                  className="mt-4"
                  role="img"
                  aria-label={`Net pay by payroll period: ${summary.history
                    .map(
                      (period) =>
                        `${period.rangeLabel || period.name}, ${formatPayslipCurrency(period.netPay)}`,
                    )
                    .join("; ")}`}
                >
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={rows} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10 }}
                        interval={0}
                        tickLine={false}
                        axisLine={false}
                        height={36}
                      />
                      <YAxis
                        tickFormatter={(value: number) => formatPayslipCompactCurrency(value)}
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={54}
                      />
                      <Tooltip
                        cursor={{ fill: "var(--muted)" }}
                        formatter={(value) => formatPayslipCurrency(Number(value))}
                        contentStyle={{
                          borderRadius: 8,
                          borderColor: "var(--border)",
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="netPay"
                        name="Net pay"
                        fill="var(--chart-1)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={48}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
