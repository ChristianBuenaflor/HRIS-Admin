import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  formatHoursWorked,
  formatTime,
  getDepartmentName,
  getEmployeeName,
  getHolidayTypeName,
  getInitials,
  getLeaveTypeName,
  getProfilePictureUrl,
} from "../calendarUtils";
import type { CalendarDay, EmployeeDayStatus } from "../types";

const STATUS_META: Record<
  EmployeeDayStatus,
  { label: string; badge: string; dot: string }
> = {
  absent: {
    label: "Absent",
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
  },
  late: {
    label: "Late",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  leave: {
    label: "On leave",
    badge: "border-violet-200 bg-violet-50 text-violet-700",
    dot: "bg-violet-500",
  },
  missed: {
    label: "Missed",
    badge: "border-slate-200 bg-slate-50 text-slate-600",
    dot: "bg-slate-400",
  },
  present: {
    label: "Present",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  none: {
    label: "No record",
    badge: "border-slate-200 bg-slate-50 text-slate-500",
    dot: "bg-slate-300",
  },
  holiday: {
    label: "Holiday",
    badge: "border-sky-200 bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
  },
  weekend: {
    label: "Weekend",
    badge: "border-slate-200 bg-slate-50 text-slate-500",
    dot: "bg-slate-300",
  },
};

const STATUS_ORDER: Record<EmployeeDayStatus, number> = {
  absent: 0,
  late: 1,
  leave: 2,
  missed: 3,
  present: 4,
  none: 5,
  holiday: 6,
  weekend: 7,
};

function SummaryPill({
  value,
  label,
  dot,
}: {
  value: number;
  label: string;
  dot: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1 text-xs">
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      <span className="font-semibold">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

export function DayAttendanceDialog({
  day,
  onClose,
}: {
  day: CalendarDay | null;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch("");
  }, [day?.date]);

  const filteredEmployees = useMemo(() => {
    if (!day) return [];

    const query = search.trim().toLowerCase();

    return day.employees
      .filter(({ employee }) => {
        if (!query) return true;
        const name = getEmployeeName(employee).toLowerCase();
        const employeeId = String(employee.employee_id ?? "").toLowerCase();
        return name.includes(query) || employeeId.includes(query);
      })
      .sort((left, right) => {
        const statusDifference =
          STATUS_ORDER[left.status] - STATUS_ORDER[right.status];
        if (statusDifference !== 0) return statusDifference;
        return getEmployeeName(left.employee).localeCompare(
          getEmployeeName(right.employee),
        );
      });
  }, [day, search]);

  if (!day) return null;

  const dateLabel = format(
    new Date(`${day.date}T00:00:00`),
    "EEEE, MMMM d, yyyy",
  );

  const summaryItems = [
    { label: "present", value: day.counts.present, dot: "bg-emerald-500" },
    { label: "late", value: day.counts.late, dot: "bg-amber-500" },
    { label: "absent", value: day.counts.absent, dot: "bg-rose-500" },
    { label: "on leave", value: day.counts.leave, dot: "bg-violet-500" },
    { label: "missed", value: day.counts.missed, dot: "bg-slate-400" },
    { label: "pending", value: day.counts.pending, dot: "bg-slate-300" },
  ].filter((item) => item.value > 0);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-6 pb-4 pt-6">
          <div className="pr-8">
            <DialogTitle>Attendance — {dateLabel}</DialogTitle>
            <DialogDescription className="mt-1">
              {day.counts.total} active employees · {day.counts.recorded}{" "}
              recorded
            </DialogDescription>
          </div>

          {day.holiday && (
            <div className="mt-3 flex items-start gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sky-800">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">
                  {day.holiday.holiday_name}
                </p>
                <p className="text-xs text-sky-700">
                  {getHolidayTypeName(day.holiday)}
                </p>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-3 px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {summaryItems.length > 0 ? (
              summaryItems.map((item) => (
                <SummaryPill
                  key={item.label}
                  value={item.value}
                  label={item.label}
                  dot={item.dot}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No attendance recorded for this date.
              </p>
            )}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee or employee ID"
              aria-label="Search employees"
              className="pl-9"
            />
          </div>
        </div>

        <div className="max-h-[45vh] overflow-y-auto border-t">
          {filteredEmployees.length > 0 ? (
            <ul className="divide-y">
              {filteredEmployees.map((entry) => {
                const name = getEmployeeName(entry.employee);
                const profilePicture = getProfilePictureUrl(
                  entry.employee.profile_picture,
                );
                const department = getDepartmentName(entry.employee);
                const status = STATUS_META[entry.status];
                const attendance = entry.attendance;
                const note = entry.leave
                  ? getLeaveTypeName(entry.leave)
                  : entry.holiday
                    ? entry.holiday.holiday_name
                    : "";

                return (
                  <li
                    key={entry.employee.id}
                    className="flex flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {profilePicture && (
                          <AvatarImage src={profilePicture} alt={name} />
                        )}
                        <AvatarFallback className="text-xs">
                          {getInitials(entry.employee)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium">{name}</p>
                          <Badge
                            variant="outline"
                            className={cn("text-[11px]", status.badge)}
                          >
                            {status.label}
                          </Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {entry.employee.employee_id ||
                            `Employee #${entry.employee.id}`}
                          {department ? ` · ${department}` : ""}
                          {note ? ` · ${note}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs sm:w-[280px] sm:shrink-0">
                      <div>
                        <p className="text-[10px] text-muted-foreground">
                          Clock in
                        </p>
                        <p className="font-medium tabular-nums">
                          {formatTime(attendance?.clock_in)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">
                          Clock out
                        </p>
                        <p className="font-medium tabular-nums">
                          {formatTime(attendance?.clock_out)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">
                          Hours
                        </p>
                        <p className="font-medium tabular-nums">
                          {formatHoursWorked(attendance?.hours_worked)}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 px-6 py-10 text-center">
              <Search className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium">
                No employees match “{search}”.
              </p>
              <p className="text-xs text-muted-foreground">
                Try a name or employee ID.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
