import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DepartmentOverview } from "../dashboardData";
import { PanelEmpty, PanelError } from "./PanelState";

interface DepartmentChartProps {
  data: DepartmentOverview[];
  error?: string;
  onRetry: () => void;
  className?: string;
}

export function DepartmentChart({ data, error, onRetry, className }: DepartmentChartProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Department distribution</CardTitle>
          <CardDescription>Employees by department</CardDescription>
        </div>
        {data.length > 0 ? (
          <Badge variant="outline">
            {data.length} {data.length === 1 ? "department" : "departments"}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent>
        {error ? (
          <PanelError message={error} onRetry={onRetry} />
        ) : data.length === 0 ? (
          <PanelEmpty message="No department data yet. Add departments in Setup Manager to see the distribution." />
        ) : (
          <div
            role="img"
            aria-label={`Employee count by department: ${data
              .map((department) => `${department.name}, ${department.employees}`)
              .join("; ")}`}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value: string) =>
                    value.length > 18 ? `${value.slice(0, 18)}...` : value
                  }
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{
                    borderRadius: 8,
                    borderColor: "var(--border)",
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="employees"
                  name="Employees"
                  fill="var(--chart-1)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
