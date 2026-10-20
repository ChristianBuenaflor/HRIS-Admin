import axios from "axios";
import api from "@/utils/axios";
import { toDateKey } from "./calendarUtils";
import type {
  AttendanceCalendarData,
  AttendanceRecord,
  Employee,
  HolidayRecord,
  LeaveRecord,
} from "./types";

interface EmployeePagePayload {
  employees?: unknown;
  data?: unknown;
  pagination?: { last_page?: number | string | null } | null;
  [key: string]: unknown;
}

const EMPLOYEE_PAGE_SIZE = 50;
const MAX_EMPLOYEE_PAGES = 100;

function dedupeEmployees(employees: Employee[]): Employee[] {
  const byId = new Map<number, Employee>();
  for (const employee of employees) {
    if (employee?.id === undefined || employee?.id === null) continue;
    byId.set(employee.id, employee);
  }
  return Array.from(byId.values());
}

export async function collectEmployeePages(
  loadPage: (page: number, perPage: number) => Promise<EmployeePagePayload>,
  perPage = EMPLOYEE_PAGE_SIZE,
): Promise<Employee[]> {
  const firstPage = await loadPage(1, perPage);
  const employees = asArray<Employee>(
    firstPage.employees ?? firstPage.data ?? firstPage,
  );

  const reportedLastPage = Number(firstPage.pagination?.last_page ?? 1);
  const lastPage = Number.isFinite(reportedLastPage)
    ? Math.min(Math.max(Math.trunc(reportedLastPage), 1), MAX_EMPLOYEE_PAGES)
    : 1;

  if (lastPage <= 1) return dedupeEmployees(employees);

  const remainingPages = Array.from(
    { length: lastPage - 1 },
    (_, index) => index + 2,
  );
  const responses = await Promise.all(
    remainingPages.map((page) => loadPage(page, perPage)),
  );
  const remainingEmployees = responses.flatMap((response) =>
    asArray<Employee>(response.employees ?? response.data ?? response),
  );

  return dedupeEmployees([...employees, ...remainingEmployees]);
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of [
      "data",
      "records",
      "employees",
      "holidays",
      "leaves",
      "attendance",
    ]) {
      if (Array.isArray(record[key])) return record[key] as T[];
    }

    // /getholidays can return a single holiday object instead of a list.
    if ("holiday_date" in record || "start_date" in record || "clock_in" in record) {
      return [value as T];
    }
  }

  return [];
}

function getMonthBounds(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { start: toDateKey(start), end: toDateKey(end) };
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) return message;

    if (error.response?.status === 401) {
      return "Your session has expired. Please sign in again.";
    }

    return error.message || "Failed to load attendance data.";
  }

  if (error instanceof Error && error.message) return error.message;
  return "Failed to load attendance data.";
}

export async function fetchAttendanceCalendarData(
  year: number,
  month: number,
): Promise<AttendanceCalendarData> {
  const [attendanceResult, employeesResult, holidaysResult, leavesResult] =
    await Promise.allSettled([
      api.get("/attendances"),
      collectEmployeePages(async (page, perPage) => {
        const response = await api.get("/employees", {
          params: { page, per_page: perPage },
        });
        return response.data as EmployeePagePayload;
      }),
      api.get("/getholidays"),
      api.get("/leaves"),
    ]);

  if (attendanceResult.status === "rejected") {
    throw new Error(
      `Could not load attendance records. ${getErrorMessage(attendanceResult.reason)}`,
    );
  }

  if (employeesResult.status === "rejected") {
    throw new Error(
      `Could not load employees. ${getErrorMessage(employeesResult.reason)}`,
    );
  }

  const warnings: string[] = [];

  if (holidaysResult.status === "rejected") {
    warnings.push(
      "Holidays could not be loaded, so holiday statuses may be incomplete.",
    );
  }

  if (leavesResult.status === "rejected") {
    warnings.push(
      "Approved leaves could not be loaded, so leave statuses may be incomplete.",
    );
  }

  const attendance = asArray<AttendanceRecord>(
    attendanceResult.value.data?.data ?? attendanceResult.value.data,
  );

  const employees = employeesResult.value;

  const holidays =
    holidaysResult.status === "fulfilled"
      ? asArray<HolidayRecord>(
          holidaysResult.value.data?.data ??
            holidaysResult.value.data?.holidays ??
            holidaysResult.value.data,
        )
      : [];

  const leaves =
    leavesResult.status === "fulfilled"
      ? asArray<LeaveRecord>(
          leavesResult.value.data?.data ?? leavesResult.value.data,
        )
      : [];

  const { start, end } = getMonthBounds(year, month);

  return {
    employees,
    attendance: attendance.filter((record) => {
      const dateKey = toDateKey(record.clock_in);
      return Boolean(dateKey) && dateKey >= start && dateKey <= end;
    }),
    leaves: leaves.filter((entry) => {
      const leaveStart = toDateKey(entry.start_date);
      const leaveEnd = toDateKey(entry.end_date);
      return Boolean(leaveStart && leaveEnd) && leaveStart <= end && leaveEnd >= start;
    }),
    holidays: holidays.filter((entry) => {
      const dateKey = toDateKey(entry.holiday_date);
      return Boolean(dateKey) && dateKey >= start && dateKey <= end;
    }),
    warnings,
  };
}
