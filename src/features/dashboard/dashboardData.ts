export interface DepartmentOverview {
  id: number | string;
  name: string;
  employees: number;
}

export type AttendanceSource = "attendance" | "eod" | "dashboard" | "none";

export interface AttendanceSummary {
  present: number;
  late: number;
  absent: number;
  total: number;
  rate: number;
  hoursWorked: number;
  lateMinutes: number;
  recorded: number;
  onLeave: number;
  source: AttendanceSource;
}

export interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number | null;
}

export type PayslipStatus = "processed" | "draft";

export interface PayslipPeriod {
  id: string;
  name: string;
  status: PayslipStatus;
  payDate: string;
  rangeLabel: string;
  employeeCount: number;
  netPay: number;
  grossPay: number;
  deductions: number;
}

export interface PayslipSummary {
  latestProcessed: PayslipPeriod | null;
  latestDraft: PayslipPeriod | null;
  history: PayslipPeriod[];
}

export type ApprovalType = "leave" | "overtime" | "loan";

export interface ApprovalItem {
  id: string;
  type: ApprovalType;
  employeeName: string;
  label: string;
  date: string;
}

export interface ApprovalSummary {
  total: number;
  leaves: number;
  overtime: number;
  loans: number;
  items: ApprovalItem[];
}

export interface InterviewItem {
  id: string;
  candidateName: string;
  position: string;
  date: string;
  time: string;
}

export interface StageCount {
  stage: string;
  count: number;
}

export interface RecruitmentSummary {
  openPostings: number;
  totalApplicants: number;
  newApplicants: number;
  stages: StageCount[];
  upcomingInterviews: InterviewItem[];
}

export interface PayrollSummary {
  totalPeriods: number;
  processed: number;
  drafts: number;
  activeEmployees: number;
}

export interface AnnouncementItem {
  id: number | string;
  title: string;
  description: string;
  author: string;
  createdAt: string;
}

export interface HolidayItem {
  id: number | string;
  name: string;
  date: string;
  type: string;
}

interface DepartmentSources {
  dashboard?: {
    department_overview?: Array<{
      id?: number | string;
      name?: string;
      employees_count?: number | string;
    }>;
  } | null;
  employees?: Array<Record<string, unknown>> | null;
  departments?: Array<Record<string, unknown>> | null;
}

interface AttendanceSources {
  dashboard?: {
    attendance_rate?: number | string;
    today_attendance?: {
      present?: number | string;
      late?: number | string;
      absent?: number | string;
    };
  } | null;
  eod?: {
    total_present?: number | string;
    total_late?: number | string;
    total_on_time?: number | string;
    total_hours_worked?: number | string;
    total_late_minutes?: number | string;
  } | null;
  attendance?: unknown;
  leaves?: unknown;
  totalEmployees?: number;
  now?: Date;
}

interface EmployeeStatsSources {
  dashboardTotal?: number;
  summary?: {
    total_employees?: number | string;
    active_employees?: number | string;
    inactive_employees?: number | string;
  } | null;
  employees?: Array<Record<string, unknown>> | null;
  payrollActive?: number;
}

interface ApprovalSources {
  leaves?: unknown;
  overtime?: unknown;
  loans?: unknown;
  dashboardPendingLeaves?: number | string;
}

interface RecruitmentSources {
  jobPostings?: unknown;
  applicants?: unknown;
  interviews?: unknown;
  now?: Date;
}

type UnknownRecord = Record<string, unknown>;

export const asRecord = (value: unknown): UnknownRecord | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;

const toNumber = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes";
  }
  return false;
};

const isArchivedEmployee = (employee: UnknownRecord): boolean =>
  toBoolean(employee.is_archived);

const isInactiveEmployee = (employee: UnknownRecord): boolean => {
  const value = employee.is_active;
  if (value === undefined || value === null || value === "") return false;
  return !toBoolean(value);
};

const padding = (value: number) => String(value).padStart(2, "0");

export const toDateKey = (value: unknown): string => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (!value) return "";

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${padding(date.getMonth() + 1)}-${padding(date.getDate())}`;
};

const toDateTimeKey = (value: unknown): string => {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return `${toDateKey(value)} ${padding(date.getHours())}:${padding(date.getMinutes())}`;
};

export function asArray<T>(value: unknown, keys: string[] = []): T[] {
  if (Array.isArray(value)) return value as T[];

  if (value && typeof value === "object") {
    const record = value as UnknownRecord;
    const candidates = [
      ...keys,
      "data",
      "records",
      "employees",
      "departments",
      "job_postings",
      "leaves",
      "attendance",
      "holidays",
      "announcements",
      "loans",
      "applicants",
      "interviews",
    ];

    for (const key of candidates) {
      const candidate = record[key];
      if (Array.isArray(candidate)) return candidate as T[];

      if (candidate && typeof candidate === "object") {
        const nested = asArray<T>(candidate, keys);
        if (nested.length > 0) return nested;
      }
    }

    if ("id" in record) return [value as T];
  }

  return [];
}

export function isMissingResourceError(error: unknown): boolean {
  const record = asRecord(error);
  const status = toNumber(asRecord(record?.response)?.status);
  if (status === 404) return true;

  const message = typeof record?.message === "string" ? record.message : "";
  return /no\s+.+\s+found/i.test(message);
}

export function getErrorMessage(error: unknown): string {
  const record = asRecord(error);
  const response = asRecord(record?.response);
  const data = asRecord(response?.data);
  const apiMessage = data?.message;

  if (typeof apiMessage === "string" && apiMessage.trim()) return apiMessage;
  if (error instanceof Error && error.message) return error.message;
  if (typeof record?.message === "string" && record.message.trim()) return record.message;

  return "Request failed";
}

const statusIsPending = (status: unknown): boolean =>
  String(status ?? "").trim().toLowerCase() === "pending";

const employeeName = (employee: unknown): string => {
  const record = asRecord(employee);
  const fullName = [record?.first_name, record?.middle_name, record?.last_name]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (fullName) return fullName;
  if (typeof record?.name === "string" && record.name.trim()) return record.name.trim();
  return "Unknown employee";
};

export function buildEmployeeStats(sources: EmployeeStatsSources): EmployeeStats {
  const summary = sources.summary;
  const summaryTotal = toNumber(summary?.total_employees);
  const summaryActive = toNumber(summary?.active_employees);
  const summaryInactive = toNumber(summary?.inactive_employees);

  if (summaryTotal > 0 || summaryActive > 0 || summaryInactive > 0) {
    const total = summaryTotal > 0 ? summaryTotal : summaryActive + summaryInactive;
    let active = summaryActive;
    let inactive = summaryInactive;

    if (total > 0 && active === 0 && inactive === 0) active = total;
    if (total > 0 && inactive === 0 && active !== total) inactive = Math.max(total - active, 0);
    if (total > 0 && active === 0 && inactive > 0) active = Math.max(total - inactive, 0);

    return {
      totalEmployees: total,
      activeEmployees: active,
      inactiveEmployees: inactive,
    };
  }

  if (sources.employees) {
    const employees = sources.employees.filter(
      (employee) => employee && !isArchivedEmployee(employee),
    );

    if (employees.length > 0) {
      const active = employees.filter((employee) => !isInactiveEmployee(employee)).length;
      return {
        totalEmployees: employees.length,
        activeEmployees: active,
        inactiveEmployees: employees.length - active,
      };
    }
  }

  const activeFallback =
    sources.dashboardTotal && sources.dashboardTotal > 0
      ? sources.dashboardTotal
      : sources.payrollActive && sources.payrollActive > 0
        ? sources.payrollActive
        : 0;

  return {
    totalEmployees: activeFallback,
    activeEmployees: activeFallback,
    inactiveEmployees: null,
  };
}

export function buildDepartmentOverview(sources: DepartmentSources): DepartmentOverview[] {
  const dashboardRows = (sources.dashboard?.department_overview ?? [])
    .map((row) => ({
      id: row.id ?? row.name ?? "department",
      name: String(row.name ?? "").trim(),
      employees: toNumber(row.employees_count),
    }))
    .filter((row) => row.name.length > 0);

  if (dashboardRows.length > 0) return dashboardRows;

  if (sources.employees) {
    const counts = new Map<string, number>();

    for (const employee of sources.employees) {
      if (!employee || toBoolean(employee.is_archived)) continue;

      const department = employee.department;
      const departmentRecord = asRecord(department);
      const name =
        typeof department === "string"
          ? department
          : String(departmentRecord?.department_name ?? departmentRecord?.name ?? employee.department_name ?? "").trim();

      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }

    const rows = Array.from(counts, ([name, employees]) => ({
      id: name,
      name,
      employees,
    })).sort((a, b) => b.employees - a.employees || a.name.localeCompare(b.name));

    if (rows.length > 0) return rows;
  }

  if (sources.departments) {
    return sources.departments
      .filter((department) => {
        if (toBoolean(department.is_archived)) return false;
        if (department.is_active !== undefined && !toBoolean(department.is_active)) return false;
        return true;
      })
      .map((department) => ({
        id: (department.id as number | string | undefined) ?? String(department.department_name ?? ""),
        name: String(department.department_name ?? department.name ?? "").trim(),
        employees: toNumber(department.total_employees ?? department.employees_count),
      }))
      .filter((department) => department.name.length > 0)
      .sort((a, b) => b.employees - a.employees || a.name.localeCompare(b.name));
  }

  return [];
}

const countApprovedLeave = (leaves: unknown, todayKey: string): Set<string> => {
  const employeeIds = new Set<string>();

  for (const leave of asArray<UnknownRecord>(leaves)) {
    if (toBoolean(leave.is_archived)) continue;
    if (String(leave.status ?? "").trim().toLowerCase() !== "approved") continue;

    const start = toDateKey(leave.start_date);
    const end = toDateKey(leave.end_date);
    if (!start || !end || start > todayKey || end < todayKey) continue;

    const employeeId = leave.employee_id ?? asRecord(leave.employee)?.id;
    if (employeeId !== undefined && employeeId !== null && String(employeeId)) {
      employeeIds.add(String(employeeId));
    }
  }

  return employeeIds;
};

export function buildAttendanceSummary(sources: AttendanceSources): AttendanceSummary {
  const now = sources.now ?? new Date();
  const todayKey = toDateKey(now);
  const totalEmployees = sources.totalEmployees ?? 0;
  const attendanceAvailable = sources.attendance !== null && sources.attendance !== undefined;

  if (attendanceAvailable) {
    const byEmployee = new Map<string, UnknownRecord>();

    for (const record of asArray<UnknownRecord>(sources.attendance)) {
      if (toDateKey(record.clock_in) !== todayKey) continue;

      const employeeId = record.employee_id ?? asRecord(record.employee)?.id;
      if (employeeId === undefined || employeeId === null || !String(employeeId)) continue;

      const key = String(employeeId);
      const existing = byEmployee.get(key);
      if (!existing || String(record.clock_in ?? "") < String(existing.clock_in ?? "")) {
        byEmployee.set(key, record);
      }
    }

    let present = 0;
    let late = 0;
    let explicitAbsent = 0;
    let hoursWorked = 0;
    const attendanceLeaveIds = new Set<string>();
    const approvedLeaveIds = countApprovedLeave(sources.leaves, todayKey);

    for (const [employeeId, record] of byEmployee) {
      const status = String(record.status ?? "").trim().toLowerCase();
      const approvedLeave = approvedLeaveIds.has(employeeId);

      if (status === "late") late += 1;
      else if (status === "present" || status === "half-day" || status === "half day") {
        present += 1;
      } else if (status === "absent" || status === "missed") {
        if (approvedLeave) attendanceLeaveIds.add(employeeId);
        else explicitAbsent += 1;
      } else if (status === "leave" || status === "on leave" || approvedLeave) {
        attendanceLeaveIds.add(employeeId);
      } else present += 1;

      hoursWorked += toNumber(record.hours_worked);
    }

    for (const employeeId of attendanceLeaveIds) approvedLeaveIds.add(employeeId);
    for (const employeeId of byEmployee.keys()) {
      if (!attendanceLeaveIds.has(employeeId)) approvedLeaveIds.delete(employeeId);
    }

    const onLeave = approvedLeaveIds.size;
    const recorded = present + late + explicitAbsent;
    const total = Math.max(totalEmployees, present + late + explicitAbsent + onLeave);
    const absent =
      recorded > 0 ? Math.max(total - present - late - onLeave, 0) : 0;
    const rate =
      recorded > 0 && total > 0
        ? Math.round(((present + late) / total) * 100)
        : 0;

    return {
      present,
      late,
      absent,
      total,
      rate,
      hoursWorked,
      lateMinutes: 0,
      recorded,
      onLeave,
      source: "attendance",
    };
  }

  const totalPresent = toNumber(sources.eod?.total_present);
  const totalLate = toNumber(sources.eod?.total_late);
  const onTime = toNumber(sources.eod?.total_on_time);
  const hasEodData = totalPresent > 0 || totalLate > 0 || onTime > 0;

  if (sources.eod && hasEodData) {
    const presentFromEod = onTime > 0 ? onTime : Math.max(totalPresent - totalLate, 0);
    const recorded = presentFromEod + totalLate;
    const total = Math.max(totalEmployees, recorded);
    const absent = recorded > 0 ? Math.max(total - recorded, 0) : 0;
    const rate = recorded > 0 && total > 0 ? Math.round((recorded / total) * 100) : 0;

    return {
      present: presentFromEod,
      late: totalLate,
      absent,
      total,
      rate,
      hoursWorked: toNumber(sources.eod.total_hours_worked),
      lateMinutes: toNumber(sources.eod.total_late_minutes),
      recorded,
      onLeave: 0,
      source: "eod",
    };
  }

  const counts = sources.dashboard?.today_attendance;
  if (counts) {
    const present = toNumber(counts.present);
    const late = toNumber(counts.late);
    const recorded = present + late;
    const total = Math.max(totalEmployees, recorded + toNumber(counts.absent));
    const absent = recorded > 0 ? Math.max(total - recorded, 0) : 0;
    const reportedRate = toNumber(sources.dashboard?.attendance_rate);
    const rate =
      recorded > 0
        ? reportedRate > 0
          ? Math.round(reportedRate)
          : total > 0
            ? Math.round((recorded / total) * 100)
            : 0
        : 0;

    return {
      present,
      late,
      absent,
      total,
      rate,
      hoursWorked: 0,
      lateMinutes: 0,
      recorded,
      onLeave: 0,
      source: "dashboard",
    };
  }

  return {
    present: 0,
    late: 0,
    absent: 0,
    total: totalEmployees,
    rate: 0,
    hoursWorked: 0,
    lateMinutes: 0,
    recorded: 0,
    onLeave: 0,
    source: "none",
  };
}

export function buildApprovalSummary(sources: ApprovalSources): ApprovalSummary {
  const leavesAvailable = sources.leaves !== null && sources.leaves !== undefined;
  const leaveRows = asArray<UnknownRecord>(sources.leaves);
  const pendingLeaves = leaveRows.filter((leave) => statusIsPending(leave.status));
  const leaveCount = leavesAvailable ? pendingLeaves.length : toNumber(sources.dashboardPendingLeaves);

  const overtimeRows = asArray<UnknownRecord>(sources.overtime);
  const pendingOvertime = overtimeRows.filter((request) => statusIsPending(request.status));
  const overtimePagination = asRecord(asRecord(sources.overtime)?.pagination);
  const overtimeTotal = toNumber(overtimePagination?.total);
  const trustOvertimeTotal =
    overtimeRows.length > 0 && overtimeRows.every((request) => statusIsPending(request.status));
  const overtimeCount = trustOvertimeTotal
    ? Math.max(overtimeTotal, pendingOvertime.length)
    : pendingOvertime.length;

  const loanRows = asArray<UnknownRecord>(sources.loans);
  const pendingLoans = loanRows.filter((loan) => statusIsPending(loan.status));
  const loanCount = pendingLoans.length;

  const items: ApprovalItem[] = [
    ...pendingLeaves.map((leave) => {
      const leaveType = asRecord(leave.leave_type);
      const label = `${leaveType?.leave_name ?? "Leave"} · ${toNumber(leave.total_days)}d`;
      return {
        id: String(leave.id ?? ""),
        type: "leave" as const,
        employeeName: employeeName(leave.employee),
        label,
        date: String(leave.created_at ?? ""),
      };
    }),
    ...pendingOvertime.map((request) => ({
      id: String(request.id ?? ""),
      type: "overtime" as const,
      employeeName: employeeName(request.employee),
      label: `${toNumber(request.total_hours)}h overtime`,
      date: String(request.created_at ?? request.overtime_date ?? ""),
    })),
    ...pendingLoans.map((loan) => {
      const loanType = asRecord(loan.loanType);
      return {
        id: String(loan.id ?? ""),
        type: "loan" as const,
        employeeName: employeeName(loan.employee),
        label: `${loanType?.type_name ?? "Loan"} loan`,
        date: String(loan.created_at ?? ""),
      };
    }),
  ].sort((a, b) => {
    const aTime = Date.parse(a.date);
    const bTime = Date.parse(b.date);
    if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
    if (Number.isNaN(aTime)) return 1;
    if (Number.isNaN(bTime)) return -1;
    return bTime - aTime;
  });

  return {
    total: leaveCount + overtimeCount + loanCount,
    leaves: leaveCount,
    overtime: overtimeCount,
    loans: loanCount,
    items: items.slice(0, 5),
  };
}

export function pickUpcomingHolidays(
  holidays: unknown,
  now: Date = new Date(),
  limit = 5,
): HolidayItem[] {
  const todayKey = toDateKey(now);

  return asArray<UnknownRecord>(holidays)
    .filter((holiday) => !toBoolean(holiday.is_archived))
    .map((holiday) => {
      const holidayType = asRecord(holiday.holiday_type);
      return {
        id: (holiday.id as number | string | undefined) ?? String(holiday.holiday_name ?? ""),
        name: String(holiday.holiday_name ?? "").trim(),
        date: toDateKey(holiday.holiday_date),
        type: String(holidayType?.type_name ?? holiday.holiday_type ?? "Holiday").trim(),
      };
    })
    .filter((holiday) => holiday.name.length > 0 && holiday.date >= todayKey)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

const stripHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function pickRecentAnnouncements(
  announcements: unknown,
  now: Date = new Date(),
  limit = 5,
): AnnouncementItem[] {
  const nowTime = now.getTime();

  return asArray<UnknownRecord>(announcements)
    .filter((announcement) => {
      if (toBoolean(announcement.is_archived)) return false;
      if (announcement.is_active !== undefined && !toBoolean(announcement.is_active)) return false;

      const publishTime = announcement.publish_at ? Date.parse(String(announcement.publish_at)) : NaN;
      if (!Number.isNaN(publishTime) && publishTime > nowTime) return false;

      const expireTime = announcement.expire_at ? Date.parse(String(announcement.expire_at)) : NaN;
      if (!Number.isNaN(expireTime) && expireTime < nowTime) return false;

      return true;
    })
    .map((announcement) => {
      const user = asRecord(announcement.user);
      const author = [user?.first_name, user?.last_name]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      const description = stripHtml(announcement.content);

      return {
        id: (announcement.id as number | string | undefined) ?? String(announcement.title ?? ""),
        title: String(announcement.title ?? "").trim(),
        description:
          description.length > 120 ? `${description.slice(0, 120).trimEnd()}...` : description,
        author,
        createdAt: String(announcement.created_at ?? ""),
      };
    })
    .filter((announcement) => announcement.title.length > 0)
    .sort((a, b) => {
      const aTime = Date.parse(a.createdAt);
      const bTime = Date.parse(b.createdAt);
      if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
      if (Number.isNaN(aTime)) return 1;
      if (Number.isNaN(bTime)) return -1;
      return bTime - aTime;
    })
    .slice(0, limit);
}

export function buildRecruitmentSummary(sources: RecruitmentSources): RecruitmentSummary {
  const now = sources.now ?? new Date();
  const nowTime = now.getTime();

  const postings = asArray<UnknownRecord>(sources.jobPostings, ["job_postings"]);
  const openPostings = postings.filter(
    (posting) =>
      !toBoolean(posting.is_archived) &&
      String(posting.status ?? "").trim().toLowerCase() === "active",
  ).length;

  const applicants = asArray<UnknownRecord>(sources.applicants, ["applicants"]).filter(
    (applicant) => !toBoolean(applicant.is_archived),
  );

  const stageCounts = new Map<string, number>();
  for (const applicant of applicants) {
    const stage = String(applicant.stage ?? "new").trim().toLowerCase() || "new";
    stageCounts.set(stage, (stageCounts.get(stage) ?? 0) + 1);
  }

  const stages = Array.from(stageCounts, ([stage, count]) => ({ stage, count })).sort(
    (a, b) => b.count - a.count || a.stage.localeCompare(b.stage),
  );

  const interviews = asArray<UnknownRecord>(sources.interviews, ["interviews"]);
  const upcoming = interviews
    .filter((interview) => String(interview.status ?? "").trim().toLowerCase() === "scheduled")
    .map((interview) => {
      const scheduledValue =
        interview.scheduled_at ??
        (interview.date
          ? `${String(interview.date)} ${String(interview.time ?? "00:00")}`
          : "");
      const scheduledTime = scheduledValue ? Date.parse(String(scheduledValue)) : NaN;
      const applicant = asRecord(interview.applicant);
      const jobPosting = asRecord(applicant?.job_posting);
      const candidateName =
        [applicant?.first_name, applicant?.last_name]
          .filter(Boolean)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim() ||
        String(interview.candidateName ?? "").trim() ||
        "Candidate";

      return {
        id: String(interview.id ?? ""),
        candidateName,
        position:
          String(interview.position ?? jobPosting?.title ?? "").trim() || "Not specified",
        date: toDateKey(scheduledValue),
        time: toDateTimeKey(scheduledValue).split(" ")[1] ?? "",
        scheduledTime,
      };
    })
    .filter((interview) => !Number.isNaN(interview.scheduledTime) && interview.scheduledTime >= nowTime)
    .sort((a, b) => a.scheduledTime - b.scheduledTime)
    .slice(0, 5)
    .map((interview) => ({
      id: interview.id,
      candidateName: interview.candidateName,
      position: interview.position,
      date: interview.date,
      time: interview.time,
    }));

  return {
    openPostings,
    totalApplicants: applicants.length,
    newApplicants: stageCounts.get("new") ?? 0,
    stages,
    upcomingInterviews: upcoming,
  };
}

const parseDateKey = (value: unknown): Date | null => {
  const key = toDateKey(value);
  if (!key) return null;
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatPayrollRange = (startValue: unknown, endValue: unknown): string => {
  const start = parseDateKey(startValue);
  const end = parseDateKey(endValue);
  if (!start || !end) return "";

  const sameMonth =
    start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const startLabel = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString(
    undefined,
    sameMonth ? { day: "numeric" } : { month: "short", day: "numeric" },
  );

  return start.getTime() === end.getTime() ? startLabel : `${startLabel}–${endLabel}`;
};

export function buildPayslipSummary(payload: unknown, limit = 6): PayslipSummary {
  const periods: PayslipPeriod[] = [];

  for (const row of asArray<UnknownRecord>(payload, ["payrolls"])) {
    if (toBoolean(row.is_archived)) continue;

    const status = String(row.status ?? "").trim().toLowerCase();
    if (status !== "processed" && status !== "draft") continue;

    const records = asArray<UnknownRecord>(row.payroll_records);
    const employeeIds = new Set<string>();
    let netPay = 0;
    let grossPay = 0;
    let deductions = 0;

    for (const record of records) {
      const recordPayroll = asRecord(record.payroll);
      const recordEarnings = asRecord(record.earnings);
      const recordDeductions = asRecord(record.deductions);
      const employeeId = record.employee_id ?? asRecord(record.employee)?.id;

      if (employeeId !== undefined && employeeId !== null && String(employeeId)) {
        employeeIds.add(String(employeeId));
      }

      netPay += toNumber(record.net_pay ?? recordPayroll?.net_pay);
      grossPay += toNumber(
        record.gross_pay ?? recordEarnings?.gross_pay ?? recordPayroll?.gross_pay,
      );
      deductions += toNumber(
        record.total_deductions ??
          recordDeductions?.total_deductions ??
          recordPayroll?.total_deductions,
      );
    }

    const rangeLabel =
      formatPayrollRange(row.cutoff_start_date, row.cutoff_end_date) ||
      String(row.period_name ?? "").trim();

    periods.push({
      id: String(row.id ?? rangeLabel),
      name: String(row.period_name ?? "").trim() || rangeLabel || "Payroll period",
      status,
      payDate: toDateKey(row.pay_date),
      rangeLabel,
      employeeCount: employeeIds.size || records.length,
      netPay: records.length > 0 ? netPay : toNumber(row.net_pay ?? row.total_net_pay),
      grossPay:
        records.length > 0 ? grossPay : toNumber(row.gross_pay ?? row.total_gross_pay),
      deductions:
        records.length > 0
          ? deductions
          : toNumber(row.total_deductions ?? row.deductions),
    });
  }

  periods.sort(
    (a, b) =>
      b.payDate.localeCompare(a.payDate) ||
      Number(b.id) - Number(a.id),
  );

  const latestProcessed = periods.find((period) => period.status === "processed") ?? null;
  const latestDraft = periods.find((period) => period.status === "draft") ?? null;
  const history = periods
    .filter((period) => period.status === "processed")
    .sort(
      (a, b) =>
        a.payDate.localeCompare(b.payDate) ||
        Number(a.id) - Number(b.id),
    )
    .slice(-Math.max(limit, 1));

  return { latestProcessed, latestDraft, history };
}

export function summarizePayroll(
  payload: unknown,
  employeesSummary?: { active_employees?: number | string } | null,
): PayrollSummary {
  const root = asRecord(payload);
  const data = asRecord(root?.data) ?? root;
  const activeFromPayroll = toNumber(data?.active_employees);

  return {
    totalPeriods: toNumber(data?.total_periods),
    processed: toNumber(data?.processed),
    drafts: toNumber(data?.drafts),
    activeEmployees: activeFromPayroll || toNumber(employeesSummary?.active_employees),
  };
}
