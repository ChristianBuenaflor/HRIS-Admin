import { CalendarDays, Landmark, Timer } from "lucide-react";
import type { ComponentType } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ApprovalItem, ApprovalSummary, ApprovalType } from "../dashboardData";
import { PanelEmpty, PanelError, ViewAllLink } from "./PanelState";

interface ApprovalsPanelProps {
  summary: ApprovalSummary;
  error?: string;
  onRetry: () => void;
  className?: string;
}

const TYPE_ICONS: Record<ApprovalType, ComponentType<{ className?: string }>> = {
  leave: CalendarDays,
  overtime: Timer,
  loan: Landmark,
};

const formatRequestDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

function ApprovalRow({ item }: { item: ApprovalItem }) {
  const Icon = TYPE_ICONS[item.type];

  return (
    <div className="flex items-center gap-3 py-3">
      <span className="rounded-md bg-muted p-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.employeeName}</p>
        <p className="truncate text-xs text-muted-foreground">{item.label}</p>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">
        {formatRequestDate(item.date)}
      </span>
    </div>
  );
}

export function ApprovalsPanel({ summary, error, onRetry, className }: ApprovalsPanelProps) {
  return (
    <Card
      className={cn(
        className,
        summary.total > 0 && "border-l-4 border-l-amber-400",
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Needs attention</CardTitle>
          <CardDescription>Requests waiting for a decision</CardDescription>
        </div>
        <ViewAllLink to="/attendance-leaving" label="Review requests" />
      </CardHeader>
      <CardContent>
        {error ? (
          <PanelError message={error} onRetry={onRetry} />
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold tracking-tight tabular-nums">
                {summary.total}
              </span>
              <span className="text-sm text-muted-foreground">
                {summary.total === 1 ? "request waiting" : "requests waiting"}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Leave
                </div>
                <p className="mt-1 text-xl font-semibold tabular-nums">{summary.leaves}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Timer className="h-3.5 w-3.5" />
                  Overtime
                </div>
                <p className="mt-1 text-xl font-semibold tabular-nums">{summary.overtime}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Landmark className="h-3.5 w-3.5" />
                  Loans
                </div>
                <p className="mt-1 text-xl font-semibold tabular-nums">{summary.loans}</p>
              </div>
            </div>

            {summary.items.length === 0 ? (
              <PanelEmpty message="No approvals waiting. Leave, overtime, and loan requests will appear here." />
            ) : (
              <div className="mt-4 divide-y">
                {summary.items.map((item) => (
                  <ApprovalRow key={`${item.type}-${item.id}`} item={item} />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
