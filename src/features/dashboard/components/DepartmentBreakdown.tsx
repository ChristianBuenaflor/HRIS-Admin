import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { DepartmentOverview } from "../dashboardData";
import { PanelEmpty, ViewAllLink } from "./PanelState";

interface DepartmentBreakdownProps {
  departments: DepartmentOverview[];
  totalEmployees: number;
  className?: string;
}

export function DepartmentBreakdown({
  departments,
  totalEmployees,
  className,
}: DepartmentBreakdownProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Department details</CardTitle>
          <CardDescription>How employees are distributed across teams</CardDescription>
        </div>
        <ViewAllLink to="/employees" label="Open employees" />
      </CardHeader>
      <CardContent>
        {departments.length === 0 ? (
          <PanelEmpty message="No department data yet." />
        ) : (
          <div className="divide-y">
            {departments.map((department) => {
              const share =
                totalEmployees > 0
                  ? Math.round((department.employees / totalEmployees) * 100)
                  : 0;

              return (
                <div
                  key={department.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 py-2.5 sm:grid-cols-[minmax(0,220px)_1fr_auto]"
                >
                  <p className="truncate text-sm font-medium">{department.name}</p>
                  <Progress
                    value={share}
                    className="order-3 col-span-2 h-1.5 sm:order-none sm:col-span-1"
                  />
                  <p className="text-right text-sm tabular-nums">
                    {department.employees}
                    <span className="ml-1 text-xs text-muted-foreground">({share}%)</span>
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
