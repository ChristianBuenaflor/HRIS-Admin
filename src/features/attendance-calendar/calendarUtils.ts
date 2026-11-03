import { format } from "date-fns";
import { toHolidayDateKey } from "@/utils/holidayDate";
import type {
  AttendanceRecord,
  AttendanceStatus,
  CalendarCounts,
  CalendarDay,
  CalendarDayState,
  Employee,
  EmployeeDay,
  HolidayRecord,
  LeaveRecord,
} from "./types";

const FILE_BASE_URL = "https://api-hris.slarenasitsolutions.com/public";

export interface BuildMonthCalendarArgs {
  year: number;
  /** 1-12 */
  month: number;
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRecord[];
  holidays: HolidayRecord[];
  today?: Date;
}

function isFlagSet(value: unknown): boolean {
  return value === 1 || value === true || value === "1" || value === "true";
}

export function isActiveEmployee(employee: Employee): boolean {
  if (isFlagSet(employee.is_archived)) return false;
  if (
    employee.is_active === undefined ||
    employee.is_active === null ||
    employee.is_active === ""
  ) {
    return true;
  }
  return !(
    employee.is_active === 0 ||
    employee.is_active === false ||
    employee.is_active === "0" ||
    employee.is_active === "false"
  );
}

export function toDateKey(value: string | Date | null | undefined): string {
  if (!value) return "";

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(
      value.getDate(),
    ).padStart(2, "0")}`;
  }

  const text = String(value).trim();
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "";
  return toDateKey(parsed);
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return "—";

  const parsed = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return "—";

  return format(parsed, "h:mm a");
}

export function formatHoursWorked(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined || value === "") return "—";

  const total = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(total) || total <= 0) return "—";

  const hours = Math.floor(total);
  const minutes = Math.round((total - hours) * 60);
  if (minutes === 60) return `${hours + 1}h 0m`;
  return `${hours}h ${minutes}m`;
}

export function getEmployeeName(employee: Employee): string {
  return `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim();
}

export function getInitials(employee: Employee): string {
  return `${employee.first_name?.charAt(0) ?? ""}${employee.last_name?.charAt(0) ?? ""}`
    .toUpperCase()
    .slice(0, 2);
}

export function getProfilePictureUrl(
  value: string | null | undefined,
): string | undefined {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  return `${FILE_BASE_URL}/${value.replace(/^\/+/, "")}`;
}

export function getLeaveTypeName(leave: LeaveRecord): string {
  const type = leave.leave_type ?? leave.leaveType;
  if (typeof type === "string") return type;
  return type?.leave_name || "Leave";
}

export function getHolidayTypeName(holiday: HolidayRecord): string {
  const type = holiday.holiday_type;
  if (typeof type === "string") return type;
  return type?.type_name || "Holiday";
}

export function getDepartmentName(employee: Employee): string {
  if (typeof employee.department === "string") return employee.department;
  return employee.department?.name || "";
}

function normalizeAttendanceStatus(status: string): AttendanceStatus {
  const normalized = String(status ?? "").trim().toLowerCase();
  if (normalized === "late") return "late";
  if (normalized === "missed") return "missed";
  if (normalized === "absent") return "absent";
  return "present";
}

function isApprovedLeave(leave: LeaveRecord): boolean {
  if (isFlagSet(leave.is_archived)) return false;
  return String(leave.status ?? "").trim().toLowerCase() === "approved";
}

function leaveCoversDate(leave: LeaveRecord, dateKey: string): boolean {
  const start = toDateKey(leave.start_date);
  const end = toDateKey(leave.end_date);
  if (!start || !end) return false;
  return start <= dateKey && end >= dateKey;
}

function countEmployeeDays(entries: EmployeeDay[]): CalendarCounts {
  const counts: CalendarCounts = {
    present: 0,
    late: 0,
    missed: 0,
    leave: 0,
    absent: 0,
    pending: 0,
    recorded: 0,
    total: entries.length,
  };

  for (const entry of entries) {
    switch (entry.status) {
      case "present":
        counts.present += 1;
        break;
      case "late":
        counts.late += 1;
        break;
      case "missed":
        counts.missed += 1;
        break;
      case "leave":
        counts.leave += 1;
        break;
      case "absent":
        counts.absent += 1;
        break;
      case "none":
        counts.pending += 1;
        break;
      default:
        break;
    }
  }

  counts.recorded = counts.present + counts.late + counts.missed;
  return counts;
}

export function buildMonthCalendar({
  year,
  month,
  employees,
  attendance,
  leaves,
  holidays,
  today = new Date(),
}: BuildMonthCalendarArgs): CalendarDay[] {
  const todayKey = toDateKey(today);
  const activeEmployees = employees.filter(isActiveEmployee);

  const attendanceByEmployeeDate = new Map<string, AttendanceRecord>();
  for (const record of attendance) {
    const dateKey = toDateKey(record.clock_in);
    if (!dateKey) continue;

    const key = `${record.employee_id}|${dateKey}`;
    const existing = attendanceByEmployeeDate.get(key);
    if (
      !existing ||
      String(record.clock_in ?? "") < String(existing.clock_in ?? "")
    ) {
      attendanceByEmployeeDate.set(key, record);
    }
  }

  const holidayByDate = new Map<string, HolidayRecord>();
  for (const entry of holidays) {
    if (isFlagSet(entry.is_archived)) continue;
    const dateKey = toHolidayDateKey(entry.holiday_date);
    if (dateKey) holidayByDate.set(dateKey, entry);
  }

  const leavesByEmployee = new Map<number, LeaveRecord[]>();
  for (const entry of leaves) {
    if (!isApprovedLeave(entry)) continue;
    const list = leavesByEmployee.get(entry.employee_id) ?? [];
    list.push(entry);
    leavesByEmployee.set(entry.employee_id, list);
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const calendar: CalendarDay[] = [];

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
    const date = new Date(year, month - 1, dayNumber);
    const dateKey = toDateKey(date);
    const weekday = date.getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const isToday = dateKey === todayKey;
    const isFuture = dateKey > todayKey;
    const holiday = holidayByDate.get(dateKey);

    const employeeDays: EmployeeDay[] = activeEmployees.map((employee) => {
      const attendanceRecord = attendanceByEmployeeDate.get(
        `${employee.id}|${dateKey}`,
      );

      if (attendanceRecord) {
        return {
          employee,
          status: normalizeAttendanceStatus(attendanceRecord.status),
          attendance: attendanceRecord,
        };
      }

      const leaveRecord = leavesByEmployee
        .get(employee.id)
        ?.find((entry) => leaveCoversDate(entry, dateKey));

      if (leaveRecord) {
        return { employee, status: "leave", leave: leaveRecord };
      }

      if (holiday) {
        return { employee, status: "holiday", holiday };
      }

      if (isWeekend) {
        return { employee, status: "weekend" };
      }

      if (isFuture || isToday) {
        return { employee, status: "none" };
      }

      return { employee, status: "absent" };
    });

    const counts = countEmployeeDays(employeeDays);
    let state: CalendarDayState;

    if (counts.total === 0) {
      state = holiday ? "holiday" : isWeekend ? "weekend" : "none";
    } else if (counts.recorded > 0) {
      state =
        isToday && counts.recorded + counts.leave < counts.total
          ? "partial"
          : "recorded";
    } else if (counts.leave > 0) {
      state = "leave";
    } else if (counts.absent === counts.total) {
      state = "all-absent";
    } else if (holiday) {
      state = "holiday";
    } else if (isWeekend) {
      state = "weekend";
    } else if (isFuture || isToday) {
      state = "none";
    } else {
      state = "all-absent";
    }

    calendar.push({
      date: dateKey,
      dayNumber,
      weekday,
      isToday,
      isWeekend,
      state,
      counts,
      holiday,
      employees: employeeDays,
    });
  }

  return calendar;
}

export function getDayStateLabel(day: CalendarDay): string {
  switch (day.state) {
    case "holiday":
      return day.holiday?.holiday_name || "Holiday";
    case "leave":
      return `${day.counts.leave} on leave`;
    case "weekend":
      return "Weekend";
    case "none":
      return "No record";
    case "all-absent":
      return `All absent (${day.counts.total})`;
    case "partial":
      return `${day.counts.recorded} of ${day.counts.total} recorded`;
    case "recorded": {
      const parts: string[] = [];
      if (day.counts.present > 0) parts.push(`${day.counts.present}P`);
      if (day.counts.late > 0) parts.push(`${day.counts.late}L`);
      if (day.counts.missed > 0) parts.push(`${day.counts.missed}M`);
      if (day.counts.leave > 0) parts.push(`${day.counts.leave}Lv`);
      if (day.counts.absent > 0) parts.push(`${day.counts.absent}A`);
      return parts.length > 0 ? parts.join(" · ") : "Recorded";
    }
    default:
      return "No record";
  }
}
