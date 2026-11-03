import { describe, expect, it } from "vitest";
import {
  asArray,
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
} from "./dashboardData";

describe("asArray", () => {
  it("unwraps a Laravel paginator nested under data", () => {
    expect(asArray<number>({ data: { data: [1, 2] } })).toEqual([1, 2]);
  });

  it("reads a named collection key", () => {
    expect(asArray<{ id: number }>({ job_postings: [{ id: 7 }] }, ["job_postings"])).toEqual([
      { id: 7 },
    ]);
  });

  it("returns an empty list for an unavailable payload", () => {
    expect(asArray(null)).toEqual([]);
  });
});

describe("isMissingResourceError", () => {
  it("treats a 404 as a missing resource", () => {
    expect(isMissingResourceError({ response: { status: 404 } })).toBe(true);
  });

  it("treats a no-records message as a missing resource", () => {
    expect(isMissingResourceError({ message: "No job postings found." })).toBe(true);
  });

  it("does not hide a server failure", () => {
    expect(isMissingResourceError({ response: { status: 500 }, message: "Server error" })).toBe(
      false,
    );
  });
});

describe("getErrorMessage", () => {
  it("prefers the API message", () => {
    expect(
      getErrorMessage({ response: { data: { message: "Session expired" } }, message: "x" }),
    ).toBe("Session expired");
  });

  it("falls back to the thrown message", () => {
    expect(getErrorMessage(new Error("Network down"))).toBe("Network down");
  });
});

describe("buildDepartmentOverview", () => {
  it("prefers the dashboard overview when it has rows", () => {
    const result = buildDepartmentOverview({
      dashboard: {
        department_overview: [{ id: 1, name: "Engineering", employees_count: 5 }],
      },
      employees: [{ id: 1, department: { department_name: "Sales" }, is_archived: 0 }],
      departments: [
        { id: 2, department_name: "Finance", total_employees: 3, is_archived: false },
      ],
    });

    expect(result).toEqual([{ id: 1, name: "Engineering", employees: 5 }]);
  });

  it("groups employees by department when the dashboard overview is empty", () => {
    const result = buildDepartmentOverview({
      dashboard: { department_overview: [] },
      employees: [
        { id: 1, department: { department_name: "Engineering" }, is_archived: 0 },
        { id: 2, department: { department_name: "Engineering" }, is_archived: false },
        { id: 3, department: { department_name: "Engineering" }, is_archived: 0 },
        { id: 4, department: { department_name: "Sales" }, is_archived: 1 },
        { id: 5, department_name: "HR", is_archived: 0 },
      ],
    });

    expect(result).toEqual([
      { id: "Engineering", name: "Engineering", employees: 3 },
      { id: "HR", name: "HR", employees: 1 },
    ]);
  });

  it("falls back to the departments endpoint when employee data is unavailable", () => {
    const result = buildDepartmentOverview({
      departments: [
        { id: 7, department_name: "Finance", total_employees: 4, is_archived: false },
        { id: 8, department_name: "Old Team", total_employees: 2, is_archived: true },
      ],
    });

    expect(result).toEqual([{ id: 7, name: "Finance", employees: 4 }]);
  });
});

describe("buildEmployeeStats", () => {
  it("prefers the employee summary over the dashboard active headcount", () => {
    const result = buildEmployeeStats({
      dashboardTotal: 14,
      summary: { total_employees: 15, active_employees: 14, inactive_employees: 1 },
      employees: null,
      payrollActive: 14,
    });

    expect(result).toEqual({
      totalEmployees: 15,
      activeEmployees: 14,
      inactiveEmployees: 1,
    });
  });

  it("derives both counts from the employee list when the summary is unavailable", () => {
    const result = buildEmployeeStats({
      dashboardTotal: 14,
      employees: [
        { id: 1, is_active: true, is_archived: 0 },
        { id: 2, is_active: false, is_archived: 0 },
        { id: 3, is_active: true, is_archived: 1 },
      ],
      payrollActive: 14,
    });

    expect(result).toEqual({
      totalEmployees: 2,
      activeEmployees: 1,
      inactiveEmployees: 1,
    });
  });

  it("does not invent an inactive count when only active headcounts are available", () => {
    const result = buildEmployeeStats({
      dashboardTotal: 14,
      employees: null,
      payrollActive: 14,
    });

    expect(result).toEqual({
      totalEmployees: 14,
      activeEmployees: 14,
      inactiveEmployees: null,
    });
  });

  it("uses the employee list when the summary has no countable values", () => {
    const result = buildEmployeeStats({
      dashboardTotal: 14,
      summary: { total_employees: 0, active_employees: 0, inactive_employees: 0 },
      employees: [
        { id: 1, is_active: true, is_archived: 0 },
        { id: 2, is_active: false, is_archived: 0 },
      ],
      payrollActive: 14,
    });

    expect(result).toEqual({
      totalEmployees: 2,
      activeEmployees: 1,
      inactiveEmployees: 1,
    });
  });
});

describe("buildAttendanceSummary", () => {
  it("uses today's clock-ins instead of the dashboard's all-absent fallback", () => {
    const result = buildAttendanceSummary({
      dashboard: {
        attendance_rate: 0,
        today_attendance: { present: 0, late: 0, absent: 10 },
      },
      attendance: [
        {
          id: 1,
          employee_id: 1,
          status: "present",
          clock_in: "2026-10-20T08:00:00",
          hours_worked: "8",
        },
        {
          id: 2,
          employee_id: 2,
          status: "late",
          clock_in: "2026-10-20T09:15:00",
          hours_worked: "7",
        },
        {
          id: 3,
          employee_id: 1,
          status: "absent",
          clock_in: "2026-10-20T10:00:00",
        },
      ],
      leaves: null,
      totalEmployees: 10,
      now: new Date("2026-10-20T12:00:00"),
    });

    expect(result).toMatchObject({
      present: 1,
      late: 1,
      absent: 8,
      total: 10,
      rate: 20,
      recorded: 2,
      onLeave: 0,
      hoursWorked: 15,
      source: "attendance",
    });
  });

  it("keeps a successful empty attendance response empty instead of marking everyone absent", () => {
    const result = buildAttendanceSummary({
      dashboard: {
        attendance_rate: 0,
        today_attendance: { present: 0, late: 0, absent: 14 },
      },
      attendance: [],
      leaves: null,
      totalEmployees: 14,
      now: new Date("2026-10-20T12:00:00"),
    });

    expect(result).toMatchObject({
      present: 0,
      late: 0,
      absent: 0,
      total: 14,
      rate: 0,
      recorded: 0,
      onLeave: 0,
      source: "attendance",
    });
  });

  it("counts approved leave today without double-counting employees who clocked in", () => {
    const result = buildAttendanceSummary({
      attendance: [
        {
          id: 1,
          employee_id: 1,
          status: "present",
          clock_in: "2026-10-20T08:00:00",
        },
      ],
      leaves: {
        isSuccess: true,
        data: [
          {
            id: 1,
            employee_id: 1,
            status: "Approved",
            start_date: "2026-10-20",
            end_date: "2026-10-20",
            is_archived: 0,
          },
          {
            id: 2,
            employee_id: 3,
            status: "Approved",
            start_date: "2026-10-20",
            end_date: "2026-10-20",
            is_archived: 0,
          },
        ],
      },
      totalEmployees: 5,
      now: new Date("2026-10-20T12:00:00"),
    });

    expect(result).toMatchObject({
      present: 1,
      late: 0,
      absent: 3,
      onLeave: 1,
      recorded: 1,
      total: 5,
      source: "attendance",
    });
  });

  it("keeps approved leave separate when attendance marks the employee absent", () => {
    const result = buildAttendanceSummary({
      attendance: [
        {
          id: 1,
          employee_id: 3,
          status: "absent",
          clock_in: "2026-10-20T00:00:00",
        },
      ],
      leaves: {
        isSuccess: true,
        data: [
          {
            id: 1,
            employee_id: 3,
            status: "Approved",
            start_date: "2026-10-20",
            end_date: "2026-10-20",
            is_archived: 0,
          },
        ],
      },
      totalEmployees: 5,
      now: new Date("2026-10-20T12:00:00"),
    });

    expect(result).toMatchObject({
      present: 0,
      late: 0,
      absent: 0,
      onLeave: 1,
      recorded: 0,
      total: 5,
      source: "attendance",
    });
  });

  it("falls back to the EOD summary when attendance records are unavailable", () => {
    const result = buildAttendanceSummary({
      dashboard: {
        attendance_rate: 0,
        today_attendance: { present: 0, late: 0, absent: 0 },
      },
      attendance: null,
      eod: {
        total_present: 8,
        total_late: 1,
        total_on_time: 7,
        total_hours_worked: 64.5,
        total_late_minutes: 15,
      },
      totalEmployees: 10,
    });

    expect(result).toMatchObject({
      present: 7,
      late: 1,
      absent: 2,
      total: 10,
      rate: 80,
      hoursWorked: 64.5,
      lateMinutes: 15,
      recorded: 8,
      onLeave: 0,
      source: "eod",
    });
  });

  it("ignores an empty EOD summary and still uses dashboard counts", () => {
    const result = buildAttendanceSummary({
      dashboard: {
        attendance_rate: 40,
        today_attendance: { present: 3, late: 1, absent: 6 },
      },
      attendance: null,
      eod: { total_present: 0, total_late: 0, total_on_time: 0 },
      totalEmployees: 10,
    });

    expect(result).toMatchObject({
      present: 3,
      late: 1,
      absent: 6,
      rate: 40,
      recorded: 4,
      source: "dashboard",
    });
  });

  it("uses dashboard counts only when every detailed attendance source is unavailable", () => {
    const result = buildAttendanceSummary({
      dashboard: {
        attendance_rate: 40,
        today_attendance: { present: 3, late: 1, absent: 6 },
      },
      attendance: null,
      eod: null,
      totalEmployees: 10,
    });

    expect(result).toMatchObject({
      present: 3,
      late: 1,
      absent: 6,
      total: 10,
      rate: 40,
      recorded: 4,
      source: "dashboard",
    });
  });
});

describe("buildApprovalSummary", () => {
  const leaves = {
    isSuccess: true,
    data: [
      {
        id: 1,
        status: "Pending",
        created_at: "2026-10-18T08:00:00",
        total_days: 2,
        employee: { first_name: "Ana", last_name: "Cruz" },
        leave_type: { leave_name: "Vacation" },
      },
      {
        id: 2,
        status: "Approved",
        created_at: "2026-10-17T08:00:00",
        total_days: 1,
        employee: { first_name: "Ana", last_name: "Cruz" },
        leave_type: { leave_name: "Sick" },
      },
    ],
  };

  const overtime = {
    isSuccess: true,
    data: [
      {
        id: 9,
        status: "Pending",
        created_at: "2026-10-19T08:00:00",
        overtime_date: "2026-10-21",
        total_hours: 2,
        employee: { first_name: "Ben", last_name: "Santos" },
      },
    ],
    pagination: { total: 3 },
  };

  const loans = {
    success: true,
    data: {
      data: [
        {
          id: 4,
          status: "pending",
          created_at: "2026-10-20T08:00:00",
          principal_amount: 5000,
          employee: { first_name: "Cara", last_name: "Reyes" },
          loanType: { type_name: "SSS" },
        },
      ],
    },
  };

  it("merges pending leave, overtime, and loan counts", () => {
    const result = buildApprovalSummary({ leaves, overtime, loans, dashboardPendingLeaves: 0 });

    expect(result).toMatchObject({
      leaves: 1,
      overtime: 3,
      loans: 1,
      total: 5,
    });
  });

  it("orders approval items by newest request and limits the list", () => {
    const result = buildApprovalSummary({ leaves, overtime, loans, dashboardPendingLeaves: 0 });

    expect(result.items.map((item) => item.type)).toEqual(["loan", "overtime", "leave"]);
    expect(result.items[0]).toMatchObject({
      id: "4",
      employeeName: "Cara Reyes",
      label: "SSS loan",
    });
    expect(result.items[1].label).toBe("2h overtime");
    expect(result.items[2].label).toBe("Vacation · 2d");
  });

  it("uses the dashboard pending count when leaves are unavailable", () => {
    const result = buildApprovalSummary({
      leaves: null,
      overtime: null,
      loans: null,
      dashboardPendingLeaves: 2,
    });

    expect(result).toMatchObject({ leaves: 2, overtime: 0, loans: 0, total: 2 });
  });
});

describe("pickUpcomingHolidays", () => {
  it("filters past and archived holidays, sorts soonest first, and limits rows", () => {
    const result = pickUpcomingHolidays(
      [
        {
          id: 1,
          holiday_name: "Past",
          holiday_date: "2026-10-01T00:00:00.000000Z",
          holiday_type: { type_name: "Regular" },
          is_archived: false,
        },
        {
          id: 2,
          holiday_name: "Later",
          holiday_date: "2026-11-01T16:00:00.000000Z",
          holiday_type: { type_name: "Special" },
          is_archived: false,
        },
        {
          id: 3,
          holiday_name: "Soon",
          holiday_date: "2026-10-25T00:00:00.000000Z",
          holiday_type: { type_name: "Regular" },
          is_archived: false,
        },
        {
          id: 4,
          holiday_name: "Archived",
          holiday_date: "2026-10-22T00:00:00.000000Z",
          holiday_type: { type_name: "Regular" },
          is_archived: true,
        },
      ],
      new Date("2026-10-20T00:00:00"),
      2,
    );

    expect(result).toEqual([
      { id: 3, name: "Soon", date: "2026-10-25", type: "Regular" },
      { id: 2, name: "Later", date: "2026-11-02", type: "Special" },
    ]);
  });
});

describe("pickRecentAnnouncements", () => {
  it("filters inactive, archived, expired, and unpublished rows", () => {
    const result = pickRecentAnnouncements(
      [
        {
          id: 1,
          title: "Older",
          content: "<p>Hello <b>world</b></p>",
          created_at: "2026-10-19T10:00:00",
          publish_at: null,
          expire_at: null,
          is_active: true,
          is_archived: false,
          user: { first_name: "Super", last_name: "Admin" },
        },
        {
          id: 2,
          title: "Newest",
          content: "<p>Fresh update</p>",
          created_at: "2026-10-20T10:00:00",
          publish_at: "2026-10-20T09:00:00",
          expire_at: null,
          is_active: true,
          is_archived: false,
          user: { first_name: "Super", last_name: "Admin" },
        },
        {
          id: 3,
          title: "Expired",
          content: "<p>Old news</p>",
          created_at: "2026-10-10T10:00:00",
          publish_at: null,
          expire_at: "2026-10-15T10:00:00",
          is_active: true,
          is_archived: false,
        },
        {
          id: 4,
          title: "Inactive",
          content: "<p>Hidden</p>",
          created_at: "2026-10-20T11:00:00",
          publish_at: null,
          expire_at: null,
          is_active: false,
          is_archived: false,
        },
        {
          id: 5,
          title: "Future",
          content: "<p>Scheduled</p>",
          created_at: "2026-10-20T11:00:00",
          publish_at: "2026-10-25T10:00:00",
          expire_at: null,
          is_active: true,
          is_archived: false,
        },
      ],
      new Date("2026-10-20T12:00:00"),
      5,
    );

    expect(result.map((item) => item.id)).toEqual([2, 1]);
    expect(result[1].description).toBe("Hello world");
    expect(result[0].author).toBe("Super Admin");
  });
});

describe("buildRecruitmentSummary", () => {
  it("counts active postings, applicant stages, and upcoming interviews", () => {
    const result = buildRecruitmentSummary({
      jobPostings: {
        isSuccess: true,
        job_postings: [
          { id: 1, status: "active", is_archived: false },
          { id: 2, status: "closed", is_archived: false },
          { id: 3, status: "active", is_archived: true },
        ],
      },
      applicants: {
        isSuccess: true,
        data: [
          { id: 1, stage: "new", is_archived: false },
          { id: 2, stage: "new", is_archived: false },
          { id: 3, stage: "interview", is_archived: false },
          { id: 4, stage: "new", is_archived: true },
        ],
      },
      interviews: {
        isSuccess: true,
        data: [
          {
            id: 1,
            status: "scheduled",
            scheduled_at: "2026-10-22T10:00:00",
            applicant: { first_name: "Ana", last_name: "Cruz" },
            position: "Developer",
          },
          { id: 2, status: "scheduled", scheduled_at: "2026-10-18T10:00:00" },
          { id: 3, status: "completed", scheduled_at: "2026-10-25T10:00:00" },
        ],
      },
      now: new Date("2026-10-20T00:00:00"),
    });

    expect(result.openPostings).toBe(1);
    expect(result.totalApplicants).toBe(3);
    expect(result.newApplicants).toBe(2);
    expect(result.stages).toEqual([
      { stage: "new", count: 2 },
      { stage: "interview", count: 1 },
    ]);
    expect(result.upcomingInterviews).toEqual([
      {
        id: "1",
        candidateName: "Ana Cruz",
        position: "Developer",
        date: "2026-10-22",
        time: "10:00",
      },
    ]);
  });
});

describe("buildPayslipSummary", () => {
  const payload = {
    isSuccess: true,
    payrolls: [
      {
        id: 196,
        period_name: "October 1-15, 2026",
        pay_date: "2026-10-20",
        cutoff_start_date: "2026-10-01",
        cutoff_end_date: "2026-10-15",
        status: "processed",
        is_archived: 0,
        payroll_records: [
          {
            id: 1,
            employee_id: 31,
            net_pay: "1000.00",
            gross_pay: "1200.00",
            total_deductions: "200.00",
          },
          {
            id: 2,
            employee_id: 32,
            net_pay: "2000.00",
            gross_pay: "2300.00",
            total_deductions: "300.00",
          },
        ],
      },
      {
        id: 194,
        period_name: "October 1-15 draft",
        pay_date: "2026-10-20",
        cutoff_start_date: "2026-10-01",
        cutoff_end_date: "2026-10-15",
        status: "draft",
        is_archived: 0,
        payroll_records: [
          {
            id: 3,
            employee_id: 31,
            net_pay: "1500.00",
            gross_pay: "1800.00",
            total_deductions: "300.00",
          },
        ],
      },
      {
        id: 188,
        period_name: "September 16-30, 2026",
        pay_date: "2026-10-05",
        cutoff_start_date: "2026-09-16",
        cutoff_end_date: "2026-09-30",
        status: "processed",
        is_archived: 0,
        payroll_records: [
          {
            id: 4,
            employee_id: 31,
            net_pay: "900.00",
            gross_pay: "1000.00",
            total_deductions: "100.00",
          },
        ],
      },
    ],
  };

  it("identifies the latest processed and draft payslip periods with totals", () => {
    const result = buildPayslipSummary(payload);

    expect(result.latestProcessed).toMatchObject({
      id: "196",
      name: "October 1-15, 2026",
      status: "processed",
      payDate: "2026-10-20",
      rangeLabel: "Oct 1–15",
      employeeCount: 2,
      netPay: 3000,
      grossPay: 3500,
      deductions: 500,
    });
    expect(result.latestDraft).toMatchObject({
      id: "194",
      status: "draft",
      netPay: 1500,
      employeeCount: 1,
    });
  });

  it("reads totals from the nested payroll record shape used by payroll", () => {
    const result = buildPayslipSummary({
      isSuccess: true,
      payrolls: [
        {
          id: 196,
          period_name: "October 1-15, 2026",
          pay_date: "2026-10-20",
          cutoff_start_date: "2026-10-01",
          cutoff_end_date: "2026-10-15",
          status: "processed",
          is_archived: 0,
          payroll_records: [
            {
              id: 1,
              employee: { id: 31 },
              earnings: { gross_pay: "1200.00" },
              deductions: { total_deductions: "200.00" },
              payroll: {
                gross_pay: "1200.00",
                total_deductions: "200.00",
                net_pay: "1000.00",
              },
            },
            {
              id: 2,
              employee: { id: 32 },
              earnings: { gross_pay: "2300.00" },
              deductions: { total_deductions: "300.00" },
              payroll: {
                gross_pay: "2300.00",
                total_deductions: "300.00",
                net_pay: "2000.00",
              },
            },
          ],
        },
      ],
    });

    expect(result.latestProcessed).toMatchObject({
      employeeCount: 2,
      netPay: 3000,
      grossPay: 3500,
      deductions: 500,
    });
  });

  it("returns processed periods oldest-first for the trend chart", () => {
    const result = buildPayslipSummary(payload);

    expect(result.history.map((period) => period.id)).toEqual(["188", "196"]);
  });

  it("returns an empty summary when there are no payroll periods", () => {
    expect(buildPayslipSummary(null)).toEqual({
      latestProcessed: null,
      latestDraft: null,
      history: [],
    });
  });
});

describe("summarizePayroll", () => {
  it("reads the payroll summary payload", () => {
    expect(
      summarizePayroll({
        isSuccess: true,
        data: { total_periods: 21, processed: 20, drafts: 1, active_employees: 14 },
      }),
    ).toEqual({ totalPeriods: 21, processed: 20, drafts: 1, activeEmployees: 14 });
  });

  it("falls back to the employee summary when payroll is unavailable", () => {
    expect(
      summarizePayroll({ isSuccess: false, message: "No summary" }, { active_employees: 12 }),
    ).toEqual({ totalPeriods: 0, processed: 0, drafts: 0, activeEmployees: 12 });
  });
});
