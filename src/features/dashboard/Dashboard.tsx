import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { fetchDashboardSnapshot, type DashboardSnapshot } from "./api";
import { getErrorMessage } from "./dashboardData";
import { AnnouncementsPanel } from "./components/AnnouncementsPanel";
import { ApprovalsPanel } from "./components/ApprovalsPanel";
import { AttendanceChart } from "./components/AttendanceChart";
import { DashboardSkeleton } from "./components/DashboardSkeleton";
import { DepartmentBreakdown } from "./components/DepartmentBreakdown";
import { DepartmentChart } from "./components/DepartmentChart";
import { HolidaysPanel } from "./components/HolidaysPanel";
import { KpiStrip } from "./components/KpiStrip";
import { PayslipPanel } from "./components/PayslipPanel";
import { RecruitmentPanel } from "./components/RecruitmentPanel";

const Dashboard = () => {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(async (mode: "initial" | "refresh") => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestRef.current;

    if (mode === "refresh") setRefreshing(true);
    else setLoading(true);

    try {
      const next = await fetchDashboardSnapshot({ signal: controller.signal });
      if (requestId !== requestRef.current || controller.signal.aborted) return;

      setSnapshot(next);
      setError(null);
    } catch (caught) {
      if (requestId !== requestRef.current || controller.signal.aborted) return;
      setError(getErrorMessage(caught));
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void load("initial");
    return () => abortRef.current?.abort();
  }, [load]);

  const refresh = useCallback(() => {
    void load("refresh");
  }, [load]);

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const updatedLabel = snapshot
    ? new Date(snapshot.updatedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">{todayLabel}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            People, attendance, and approvals at a glance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {updatedLabel ? (
            <span className="text-xs text-muted-foreground" aria-live="polite">
              Updated {updatedLabel}
            </span>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading || refreshing}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
            {refreshing ? "Refreshing" : "Refresh"}
          </Button>
        </div>
      </header>

      {loading ? (
        <DashboardSkeleton />
      ) : !snapshot ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <p className="font-medium">The dashboard could not load</p>
            <p className="max-w-md text-sm text-muted-foreground">
              {error ?? "Check your connection and try again."}
            </p>
            <Button variant="outline" size="sm" onClick={refresh}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              Some data could not be refreshed. Showing the last successful update.
            </div>
          ) : null}

          <KpiStrip snapshot={snapshot} />

          <div className="grid gap-6 lg:grid-cols-7">
            <DepartmentChart
              className="lg:col-span-4"
              data={snapshot.departmentOverview}
              error={snapshot.errors.departments}
              onRetry={refresh}
            />
            <AttendanceChart
              className="lg:col-span-3"
              summary={snapshot.attendance}
              error={snapshot.errors.attendance}
              onRetry={refresh}
            />
          </div>

          <PayslipPanel
            summary={snapshot.payslip}
            error={snapshot.errors.payslip}
            onRetry={refresh}
          />

          <div className="grid gap-6 xl:grid-cols-12">
            <ApprovalsPanel
              className="xl:col-span-7"
              summary={snapshot.approvals}
              error={snapshot.errors.approvals}
              onRetry={refresh}
            />
            <RecruitmentPanel
              className="xl:col-span-5"
              summary={snapshot.recruitment}
              error={snapshot.errors.recruitment}
              onRetry={refresh}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <HolidaysPanel
              holidays={snapshot.holidays}
              error={snapshot.errors.holidays}
              onRetry={refresh}
            />
            <AnnouncementsPanel
              announcements={snapshot.announcements}
              error={snapshot.errors.announcements}
              onRetry={refresh}
            />
          </div>

          {snapshot.departmentOverview.length > 0 ? (
            <DepartmentBreakdown
              departments={snapshot.departmentOverview}
              totalEmployees={snapshot.totalEmployees}
            />
          ) : null}
        </>
      )}
    </div>
  );
};

export default Dashboard;
