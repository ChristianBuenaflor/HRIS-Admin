import { afterEach, describe, expect, it, vi } from "vitest";
import api from "@/utils/axios";
import { fetchDashboardSnapshot } from "./api";

vi.mock("@/utils/axios", () => ({
  default: { get: vi.fn() },
}));

const getMock = api.get as unknown as ReturnType<typeof vi.fn>;

const ok = (data: unknown) => Promise.resolve({ data });
const fail = (status: number, message = "Server error") =>
  Promise.reject({ response: { status, data: { message } }, message });

const attendanceForToday = (present = 12, late = 2) => [
  ...Array.from({ length: present }, (_, index) => ({
    id: index + 1,
    employee_id: index + 1,
    status: "present",
    clock_in: "2026-10-20T08:00:00",
    hours_worked: "8",
  })),
  ...Array.from({ length: late }, (_, index) => ({
    id: present + index + 1,
    employee_id: present + index + 1,
    status: "late",
    clock_in: "2026-10-20T09:10:00",
    hours_worked: "7",
  })),
];

type ResponseMap = Record<string, () => Promise<{ data: unknown }>>;

const makeResponses = (): ResponseMap => ({
  "/dashboard": () =>
    ok({
      success: true,
      data: {
        total_employees: 14,
        total_departments: 0,
        pending_leaves: 1,
        attendance_rate: 100,
        today_attendance: { present: 12, late: 2, absent: 0 },
        department_overview: [],
      },
    }),
  "/employees": () =>
    ok({
      isSuccess: true,
      employees: [
        {
          id: 1,
          department: { department_name: "Engineering" },
          is_archived: 0,
        },
      ],
      summary: { total_employees: 14, active_employees: 12, inactive_employees: 2 },
      pagination: { current_page: 1, last_page: 1, per_page: 100, total: 1 },
    }),
  "/attendances": () =>
    ok({
      isSuccess: true,
      data: attendanceForToday(),
    }),
  "/departments": () => fail(404, "No active departments found."),
  "/leaves": () =>
    ok({
      isSuccess: true,
      data: [
        {
          id: 10,
          status: "Pending",
          created_at: "2026-10-20T08:00:00",
          total_days: 1,
          employee: { first_name: "Ana", last_name: "Cruz" },
          leave_type: { leave_name: "Vacation" },
        },
      ],
    }),
  "/overtime/requests": () => ok({ isSuccess: true, data: [], pagination: { total: 0 } }),
  "/loans": () => ok({ success: true, data: { data: [] } }),
  "/dashboard/eod-reports": () => ok({ isSuccess: true, summary: { total_present: 0 } }),
  "/job-postings": () =>
    ok({
      isSuccess: true,
      job_postings: [{ id: 1, title: "Developer", status: "active", is_archived: false }],
    }),
  "/applicants": () =>
    ok({
      isSuccess: true,
      data: [
        { id: 1, stage: "new", is_archived: false },
        { id: 2, stage: "new", is_archived: false },
      ],
    }),
  "/interviews": () =>
    ok({
      isSuccess: true,
      data: [
        {
          id: 1,
          status: "scheduled",
          scheduled_at: "2026-10-22T10:00:00",
          applicant: { first_name: "Ana", last_name: "Cruz" },
          position: "Developer",
        },
      ],
    }),
  "/payroll/summary": () =>
    ok({
      isSuccess: true,
      data: { total_periods: 21, processed: 20, drafts: 1, active_employees: 14 },
    }),
  "/payroll/periods": () =>
    ok({
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
          ],
        },
        {
          id: 194,
          period_name: "October 1-15, 2026 draft",
          pay_date: "2026-10-20",
          cutoff_start_date: "2026-10-01",
          cutoff_end_date: "2026-10-15",
          status: "draft",
          is_archived: 0,
          payroll_records: [
            {
              id: 2,
              employee_id: 31,
              net_pay: "1500.00",
              gross_pay: "1800.00",
              total_deductions: "300.00",
            },
          ],
        },
      ],
    }),
  "/announcements": () =>
    ok({
      isSuccess: true,
      data: [
        {
          id: 1,
          title: "Welcome",
          content: "<p>Hello team</p>",
          created_at: "2026-10-20T09:00:00",
          is_active: true,
          is_archived: false,
          user: { first_name: "Super", last_name: "Admin" },
        },
      ],
    }),
  "/getholidays": () =>
    ok({
      isSuccess: true,
      data: [
        {
          id: 1,
          holiday_name: "Founders Day",
          holiday_date: "2026-10-25",
          holiday_type: { type_name: "Regular" },
          is_archived: false,
        },
      ],
    }),
});

const useResponses = (overrides: Partial<ResponseMap> = {}) => {
  const responses = { ...makeResponses(), ...overrides };
  getMock.mockImplementation((url: string) => {
    const responder = responses[url];
    return responder ? responder() : fail(404, `Unknown endpoint ${url}`);
  });
};

const now = new Date("2026-10-20T12:00:00");

afterEach(() => {
  getMock.mockReset();
});

describe("fetchDashboardSnapshot", () => {
  it("combines every available source into one snapshot", async () => {
    useResponses();

    const snapshot = await fetchDashboardSnapshot({ now });

    expect(snapshot.totalEmployees).toBe(14);
    expect(snapshot.activeEmployees).toBe(12);
    expect(snapshot.totalDepartments).toBe(1);
    expect(snapshot.departmentOverview).toEqual([
      { id: "Engineering", name: "Engineering", employees: 1 },
    ]);
    expect(snapshot.attendance).toMatchObject({
      present: 12,
      late: 2,
      absent: 0,
      rate: 100,
      source: "attendance",
    });
    expect(snapshot.payslip.latestProcessed).toMatchObject({
      id: "196",
      status: "processed",
      netPay: 1000,
      employeeCount: 1,
    });
    expect(snapshot.payslip.latestDraft?.id).toBe("194");
    expect(snapshot.payslip.history).toHaveLength(1);
    expect(snapshot.approvals).toMatchObject({ total: 1, leaves: 1, overtime: 0, loans: 0 });
    expect(snapshot.recruitment).toMatchObject({
      openPostings: 1,
      totalApplicants: 2,
      newApplicants: 2,
    });
    expect(snapshot.payroll).toEqual({
      totalPeriods: 21,
      processed: 20,
      drafts: 1,
      activeEmployees: 14,
    });
    expect(snapshot.announcements[0]).toMatchObject({
      title: "Welcome",
      author: "Super Admin",
    });
    expect(snapshot.holidays[0]).toMatchObject({ name: "Founders Day" });
    expect(snapshot.errors).toEqual({});
  });

  it("uses the employee summary total instead of the dashboard's active headcount", async () => {
    useResponses({
      "/employees": () =>
        ok({
          isSuccess: true,
          employees: [
            {
              id: 1,
              department: { department_name: "Engineering" },
              is_archived: 0,
              is_active: true,
            },
          ],
          summary: { total_employees: 15, active_employees: 14, inactive_employees: 1 },
          pagination: { current_page: 1, last_page: 1, per_page: 100, total: 1 },
        }),
    });

    const snapshot = await fetchDashboardSnapshot({ now });

    expect(snapshot.totalEmployees).toBe(15);
    expect(snapshot.activeEmployees).toBe(14);
    expect(snapshot.inactiveEmployees).toBe(1);
  });

  it("uses today's clock-ins instead of the dashboard's all-absent counts", async () => {
    useResponses({
      "/dashboard": () =>
        ok({
          success: true,
          data: {
            total_employees: 14,
            total_departments: 0,
            pending_leaves: 1,
            attendance_rate: 0,
            today_attendance: { present: 0, late: 0, absent: 14 },
            department_overview: [],
          },
        }),
    });

    const snapshot = await fetchDashboardSnapshot({ now });

    expect(snapshot.attendance).toMatchObject({
      present: 12,
      late: 2,
      absent: 0,
      rate: 100,
      source: "attendance",
    });
  });

  it("keeps a successful empty attendance response empty", async () => {
    useResponses({
      "/attendances": () => ok({ isSuccess: true, data: [] }),
    });

    const snapshot = await fetchDashboardSnapshot({ now });

    expect(snapshot.attendance).toMatchObject({
      present: 0,
      late: 0,
      absent: 0,
      recorded: 0,
      source: "attendance",
    });
  });

  it("keeps the payslip panel isolated when payroll periods fail", async () => {
    useResponses({
      "/payroll/periods": () => fail(500, "Payroll periods unavailable"),
    });

    const snapshot = await fetchDashboardSnapshot({ now });

    expect(snapshot.payslip).toEqual({
      latestProcessed: null,
      latestDraft: null,
      history: [],
    });
    expect(snapshot.errors.payslip).toBe("Payroll periods unavailable");
    expect(snapshot.payroll.processed).toBe(20);
  });

  it("keeps the rest of the page when one endpoint fails", async () => {
    useResponses({
      "/announcements": () => fail(500, "Announcement service unavailable"),
    });

    const snapshot = await fetchDashboardSnapshot({ now });

    expect(snapshot.announcements).toEqual([]);
    expect(snapshot.errors.announcements).toBe("Announcement service unavailable");
    expect(snapshot.payroll.processed).toBe(20);
    expect(snapshot.attendance.rate).toBe(100);
  });

  it("treats a 404 no-records response as an empty panel, not an error", async () => {
    useResponses({
      "/job-postings": () => fail(404, "No job postings found."),
    });

    const snapshot = await fetchDashboardSnapshot({ now });

    expect(snapshot.recruitment.openPostings).toBe(0);
    expect(snapshot.errors.recruitment).toBeUndefined();
  });

  it("derives employee and attendance metrics when /dashboard is unavailable", async () => {
    useResponses({
      "/dashboard": () => fail(500, "Dashboard service unavailable"),
      "/attendances": () => fail(500, "Attendance service unavailable"),
      "/dashboard/eod-reports": () =>
        ok({
          isSuccess: true,
          summary: {
            total_present: 10,
            total_late: 1,
            total_on_time: 9,
            total_hours_worked: 72,
            total_late_minutes: 15,
          },
        }),
    });

    const snapshot = await fetchDashboardSnapshot({ now });

    expect(snapshot.totalEmployees).toBe(14);
    expect(snapshot.attendance).toMatchObject({
      present: 9,
      late: 1,
      absent: 4,
      rate: 71,
      recorded: 10,
      source: "eod",
    });
    expect(snapshot.errors.attendance).toBeUndefined();
  });

  it("flags the department panel when employee data fails but dashboard totals are available", async () => {
    useResponses({
      "/employees": () => fail(500, "Employee service unavailable"),
    });

    const snapshot = await fetchDashboardSnapshot({ now });

    expect(snapshot.totalEmployees).toBe(14);
    expect(snapshot.departmentOverview).toEqual([]);
    expect(snapshot.errors.departments).toBe("Employee service unavailable");
  });

  it("uses the payroll headcount when dashboard and employee data both fail", async () => {
    useResponses({
      "/dashboard": () => fail(500, "Dashboard service unavailable"),
      "/employees": () => fail(401, "Unauthenticated."),
      "/attendances": () => fail(500, "Attendance service unavailable"),
      "/dashboard/eod-reports": () => fail(500, "EOD service unavailable"),
      "/departments": () => fail(404, "No active departments found."),
    });

    const snapshot = await fetchDashboardSnapshot({ now });

    expect(snapshot.totalEmployees).toBe(14);
    expect(snapshot.payroll.activeEmployees).toBe(14);
    expect(snapshot.errors.departments).toBe("Unauthenticated.");
    expect(snapshot.errors.attendance).toBe("Dashboard service unavailable");
  });
});
