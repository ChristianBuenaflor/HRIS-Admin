import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { fetchAttendanceCalendarData, getErrorMessage } from "./api";
import { buildMonthCalendar, isActiveEmployee } from "./calendarUtils";
import { CalendarGrid } from "./components/CalendarGrid";
import { DayAttendanceDialog } from "./components/DayAttendanceDialog";
import type { AttendanceCalendarData, CalendarDay } from "./types";

const LEGEND = [
  { label: "Recorded", dot: "bg-emerald-500" },
  { label: "Partial", dot: "bg-amber-500" },
  { label: "All absent", dot: "bg-rose-500" },
  { label: "No record", dot: "bg-slate-300" },
  { label: "Weekend", dot: "bg-slate-400" },
  { label: "Holiday", dot: "bg-sky-500" },
  { label: "Leave", dot: "bg-violet-500" },
];

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {LEGEND.map((item) => (
        <span
          key={item.label}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span className={cn("h-2 w-2 rounded-full", item.dot)} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  dot,
}: {
  label: string;
  value: number;
  dot: string;
}) {
  return (
    <div className="bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className={cn("h-2 w-2 rounded-full", dot)} />
        {label}
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card className="border-destructive/30">
      <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-5 w-5" />
        </span>
        <div>
          <p className="font-medium">Could not load the attendance calendar</p>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        </div>
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptyState({ hasEmployees }: { hasEmployees: boolean }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 px-6 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <CalendarDays className="h-5 w-5" />
      </span>
      <p className="font-medium">
        {hasEmployees
          ? "No calendar data for this month"
          : "No active employees found"}
      </p>
      <p className="max-w-md text-sm text-muted-foreground">
        {hasEmployees
          ? "Attendance records will appear here once employees start clocking in."
          : "Add employees or reactivate existing employees to populate the calendar."}
      </p>
    </div>
  );
}

export default function AttendanceCalendar() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [data, setData] = useState<AttendanceCalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);
    setData(null);
    setSelectedDay(null);

    fetchAttendanceCalendarData(year, month)
      .then((result) => {
        if (!active) return;
        setData(result);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [year, month, reloadKey]);

  const days = useMemo(() => {
    if (!data) return [];

    return buildMonthCalendar({
      year,
      month,
      employees: data.employees,
      attendance: data.attendance,
      leaves: data.leaves,
      holidays: data.holidays,
    });
  }, [data, year, month]);

  const totals = useMemo(
    () =>
      days.reduce(
        (accumulator, day) => {
          accumulator.present += day.counts.present;
          accumulator.late += day.counts.late;
          accumulator.absent += day.counts.absent;
          accumulator.leave += day.counts.leave;
          return accumulator;
        },
        { present: 0, late: 0, absent: 0, leave: 0 },
      ),
    [days],
  );

  const monthLabel = format(currentDate, "MMMM yyyy");
  const activeCount = data?.employees.filter(isActiveEmployee).length ?? 0;
  const warnings = data?.warnings ?? [];

  const changeMonth = (offset: number) => {
    setCurrentDate(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() + offset, 1),
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const retry = () => {
    setReloadKey((key) => key + 1);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Attendance Calendar
          </h1>
          <p className="text-muted-foreground">
            Monthly attendance for all active employees. Select a day to see
            who is present, late, absent, or on leave.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            {loading
              ? "Loading employees…"
              : `${activeCount} active employee${activeCount === 1 ? "" : "s"}`}
          </span>
        </div>
      </div>

      {error && !data ? (
        <ErrorState message={error} onRetry={retry} />
      ) : (
        <>
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Could not refresh the calendar</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-1">
                {warnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            </div>
          )}

          <Card className="overflow-hidden py-0">
            <CardContent className="grid grid-cols-2 gap-px bg-border p-0 sm:grid-cols-4">
              <SummaryStat
                label="Present"
                value={totals.present}
                dot="bg-emerald-500"
              />
              <SummaryStat
                label="Late"
                value={totals.late}
                dot="bg-amber-500"
              />
              <SummaryStat
                label="Absent"
                value={totals.absent}
                dot="bg-rose-500"
              />
              <SummaryStat
                label="On leave"
                value={totals.leave}
                dot="bg-violet-500"
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden py-0">
            <div className="flex flex-col gap-4 border-b bg-muted/20 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => changeMonth(-1)}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={goToToday}>
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => changeMonth(1)}
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <h2 className="ml-1 flex items-center gap-2 text-lg font-semibold">
                  {monthLabel}
                  {loading && (
                    <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </h2>
              </div>
              <Legend />
            </div>

            <CardContent className="p-4">
              {loading && !data ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <p className="text-sm">Loading attendance calendar…</p>
                </div>
              ) : activeCount === 0 ? (
                <EmptyState hasEmployees={false} />
              ) : days.length > 0 ? (
                <CalendarGrid days={days} onSelectDay={setSelectedDay} />
              ) : (
                <EmptyState hasEmployees />
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            Counts are employee-days for the selected month. Weekends are
            locked. Attendance data is read-only.
          </p>
        </>
      )}

      <DayAttendanceDialog
        day={selectedDay}
        onClose={() => setSelectedDay(null)}
      />
    </div>
  );
}
