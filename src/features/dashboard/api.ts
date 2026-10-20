import api from "@/utils/axios";
import {
  asArray,
  asRecord,
  buildApprovalSummary,
  buildAttendanceSummary,
  buildDepartmentOverview,
  buildEmployeeStats,
  buildPayslipSummary,
  buildRecruitmentSummary,
  getErrorMessage,
  isMissingResourceError,
  pickRecentAnnouncements,
  pickUpcomingHolidays,
  summarizePayroll,
  toDateKey,
  type AnnouncementItem,
  type ApprovalSummary,
  type AttendanceSummary,
  type DepartmentOverview,
  type HolidayItem,
  type PayrollSummary,
  type PayslipSummary,
  type RecruitmentSummary,
} from "./dashboardData";

export interface DashboardErrors {
  employees?: string;
  departments?: string;
  attendance?: string;
  approvals?: string;
  recruitment?: string;
  payroll?: string;
  payslip?: string;
  announcements?: string;
  holidays?: string;
}

export interface DashboardSnapshot {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number | null;
  totalDepartments: number;
  departmentOverview: DepartmentOverview[];
  attendance: AttendanceSummary;
  approvals: ApprovalSummary;
  recruitment: RecruitmentSummary;
  payroll: PayrollSummary;
  payslip: PayslipSummary;
  announcements: AnnouncementItem[];
  holidays: HolidayItem[];
  errors: DashboardErrors;
  updatedAt: string;
}

interface DashboardPayload {
  total_employees?: number | string;
  total_departments?: number | string;
  pending_leaves?: number | string;
  attendance_rate?: number | string;
  today_attendance?: {
    present?: number | string;
    late?: number | string;
    absent?: number | string;
  };
  department_overview?: Array<{
    id?: number | string;
    name?: string;
    employees_count?: number | string;
  }>;
}

interface FetchResult {
  data: unknown | null;
  error: string | null;
}

interface EmployeeFetchResult extends FetchResult {
  employees: Array<Record<string, unknown>>;
}

interface FetchOptions {
  signal?: AbortSignal;
  now?: Date;
}

const toNumber = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const get = async (
  url: string,
  signal?: AbortSignal,
  params?: Record<string, unknown>,
): Promise<FetchResult> => {
  try {
    const response = await api.get(url, { params, signal });
    return { data: response.data, error: null };
  } catch (error) {
    if (isMissingResourceError(error)) return { data: null, error: null };
    return { data: null, error: getErrorMessage(error) };
  }
};

const fetchEmployees = async (signal?: AbortSignal): Promise<EmployeeFetchResult> => {
  const first = await get("/employees", signal, { page: 1, per_page: 100 });
  if (!first.data) return { ...first, employees: [] };

  const root = asRecord(first.data);
  const employees = asArray<Record<string, unknown>>(root?.employees ?? root);
  const lastPage = Math.min(Math.max(toNumber(asRecord(root?.pagination)?.last_page), 1), 10);

  if (lastPage <= 1) return { ...first, employees };

  const remainingPages = await Promise.all(
    Array.from({ length: lastPage - 1 }, (_, index) =>
      get("/employees", signal, { page: index + 2, per_page: 100 }),
    ),
  );

  for (const page of remainingPages) {
    if (!page.data) continue;
    const pageRoot = asRecord(page.data);
    employees.push(...asArray<Record<string, unknown>>(pageRoot?.employees ?? pageRoot));
  }

  return { ...first, employees };
};

const emptyCollection = (result: FetchResult): unknown => (result.error ? null : result.data ?? []);

export async function fetchDashboardSnapshot(
  options: FetchOptions = {},
): Promise<DashboardSnapshot> {
  const { signal, now = new Date() } = options;
  const todayKey = toDateKey(now);

  const [
    dashboardResult,
    employeesResult,
    attendanceResult,
    departmentsResult,
    leavesResult,
    overtimeResult,
    loansResult,
    eodResult,
    jobPostingsResult,
    applicantsResult,
    interviewsResult,
    payrollResult,
    payrollPeriodsResult,
    announcementsResult,
    holidaysResult,
  ] = await Promise.all([
    get("/dashboard", signal),
    fetchEmployees(signal),
    get("/attendances", signal),
    get("/departments", signal),
    get("/leaves", signal),
    get("/overtime/requests", signal, { status: "Pending", per_page: 5 }),
    get("/loans", signal, { per_page: 100 }),
    get("/dashboard/eod-reports", signal, { date: todayKey }),
    get("/job-postings", signal, { per_page: 100 }),
    get("/applicants", signal),
    get("/interviews", signal),
    get("/payroll/summary", signal),
    get("/payroll/periods", signal),
    get("/announcements", signal),
    get("/getholidays", signal),
  ]);

  const dashboardRecord = asRecord(dashboardResult.data);
  const dashboard = (asRecord(dashboardRecord?.data) ?? dashboardRecord) as DashboardPayload | null;

  const employeesRoot = asRecord(employeesResult.data);
  const employeesSummary = asRecord(employeesRoot?.summary);
  const payroll = summarizePayroll(
    payrollResult.error ? null : payrollResult.data,
    employeesSummary,
  );
  const employeeStats = buildEmployeeStats({
    dashboardTotal: toNumber(dashboard?.total_employees),
    summary: employeesSummary,
    employees: employeesResult.error ? null : employeesResult.employees,
    payrollActive: payroll.activeEmployees,
  });
  const { totalEmployees, activeEmployees, inactiveEmployees } = employeeStats;

  const departmentOverview = buildDepartmentOverview({
    dashboard: dashboard ?? undefined,
    employees: employeesResult.error ? null : employeesResult.employees,
    departments: asArray<Record<string, unknown>>(departmentsResult.data, ["departments"]),
  });
  const dashboardDepartmentCount = toNumber(dashboard?.total_departments);
  const totalDepartments =
    dashboardDepartmentCount > 0 ? dashboardDepartmentCount : departmentOverview.length;

  const eodRoot = asRecord(eodResult.data);
  const eodSummary = asRecord(eodRoot?.summary) ?? eodRoot;
  const attendanceRows = attendanceResult.error
    ? null
    : asArray<Record<string, unknown>>(attendanceResult.data, ["attendance"]);

  const attendance = buildAttendanceSummary({
    dashboard: dashboard ?? undefined,
    eod: eodSummary,
    attendance: attendanceRows,
    leaves: emptyCollection(leavesResult),
    totalEmployees,
    now,
  });
  const payslip = buildPayslipSummary(
    payrollPeriodsResult.error ? null : payrollPeriodsResult.data,
  );

  const approvals = buildApprovalSummary({
    leaves: emptyCollection(leavesResult),
    overtime: emptyCollection(overtimeResult),
    loans: emptyCollection(loansResult),
    dashboardPendingLeaves: toNumber(dashboard?.pending_leaves),
  });

  const recruitment = buildRecruitmentSummary({
    jobPostings: emptyCollection(jobPostingsResult),
    applicants: emptyCollection(applicantsResult),
    interviews: emptyCollection(interviewsResult),
    now,
  });

  const announcements = pickRecentAnnouncements(
    emptyCollection(announcementsResult) ?? [],
    now,
  );
  const holidays = pickUpcomingHolidays(emptyCollection(holidaysResult) ?? [], now);

  const errors: DashboardErrors = {};
  if (employeesResult.error) errors.employees = employeesResult.error;
  if (employeesResult.error && departmentOverview.length === 0) {
    errors.departments = employeesResult.error;
  }
  if (attendance.source === "none") {
    errors.attendance =
      dashboardResult.error ?? eodResult.error ?? attendanceResult.error ?? undefined;
  }
  if (leavesResult.error && overtimeResult.error && loansResult.error) {
    errors.approvals = leavesResult.error;
  }
  if (jobPostingsResult.error && applicantsResult.error && interviewsResult.error) {
    errors.recruitment = jobPostingsResult.error;
  }
  if (payrollResult.error) errors.payroll = payrollResult.error;
  if (payrollPeriodsResult.error) errors.payslip = payrollPeriodsResult.error;
  if (announcementsResult.error) errors.announcements = announcementsResult.error;
  if (holidaysResult.error) errors.holidays = holidaysResult.error;

  return {
    totalEmployees,
    activeEmployees,
    inactiveEmployees,
    totalDepartments,
    departmentOverview,
    attendance,
    approvals,
    recruitment,
    payroll,
    payslip,
    announcements,
    holidays,
    errors,
    updatedAt: now.toISOString(),
  };
}
