import { describe, expect, it } from "vitest";
import { buildMonthCalendar, formatTime, getDayStateLabel } from "./calendarUtils";
import type {
  AttendanceRecord,
  CalendarDay,
  Employee,
  HolidayRecord,
  LeaveRecord,
} from "./types";

const employees: Employee[] = [
  { id: 1, first_name: "Ana", last_name: "Cruz", is_active: 1, is_archived: 0 },
  { id: 2, first_name: "Ben", last_name: "Santos", is_active: 1, is_archived: 0 },
];

const attendance = (
  employeeId: number,
  clockIn: string,
  status = "Present",
): AttendanceRecord => ({
  id: employeeId,
  employee_id: employeeId,
  clock_in: clockIn,
  clock_out: null,
  status,
});

const leave = (
  employeeId: number,
  startDate: string,
  endDate: string,
): LeaveRecord => ({
  id: employeeId,
  employee_id: employeeId,
  start_date: startDate,
  end_date: endDate,
  status: "Approved",
  leave_type: { leave_name: "Vacation" },
});

const holiday = (date: string, name: string): HolidayRecord => ({
  id: 1,
  holiday_date: date,
  holiday_name: name,
  holiday_type: "Regular",
  is_archived: 0,
});

const build = (overrides: Partial<Parameters<typeof buildMonthCalendar>[0]> = {}) =>
  buildMonthCalendar({
    year: 2026,
    month: 10,
    employees,
    attendance: [],
    leaves: [],
    holidays: [],
    today: new Date(2026, 9, 20),
    ...overrides,
  });

const day = (days: CalendarDay[], date: string) => {
  const match = days.find((entry) => entry.date === date);
  if (!match) throw new Error(`No calendar day for ${date}`);
  return match;
};

describe("buildMonthCalendar", () => {
  it("creates one entry per day in the month", () => {
    expect(build()).toHaveLength(31);
  });

  it("marks a past day with attendance as recorded and counts implicit absences", () => {
    const days = build({ attendance: [attendance(1, "2026-10-01 09:00:00")] });

    expect(day(days, "2026-10-01")).toMatchObject({
      state: "recorded",
      counts: {
        present: 1,
        absent: 1,
        recorded: 1,
        pending: 0,
        total: 2,
      },
    });
  });

  it("marks a past working day with no records as all absent", () => {
    expect(day(build(), "2026-10-02").state).toBe("all-absent");
  });

  it("keeps weekends locked", () => {
    expect(day(build(), "2026-10-03")).toMatchObject({
      state: "weekend",
      isWeekend: true,
    });
  });

  it("marks a holiday instead of treating a weekday as absent", () => {
    const days = build({ holidays: [holiday("2026-10-05", "Founders Day")] });

    expect(day(days, "2026-10-05")).toMatchObject({
      state: "holiday",
      holiday: { holiday_name: "Founders Day" },
    });
  });

  it("uses the Philippine date for UTC holiday timestamps", () => {
    const days = build({
      holidays: [holiday("2026-10-04T16:00:00.000000Z", "Founders Day")],
    });

    expect(day(days, "2026-10-05")).toMatchObject({
      state: "holiday",
      holiday: { holiday_name: "Founders Day" },
    });
  });

  it("uses approved leave before a holiday", () => {
    const days = build({
      leaves: [leave(1, "2026-10-05", "2026-10-05")],
      holidays: [holiday("2026-10-05", "Founders Day")],
    });

    const entry = day(days, "2026-10-05");

    expect(entry).toMatchObject({
      state: "leave",
      counts: { leave: 1, absent: 0 },
    });
    expect(entry.employees.find((item) => item.employee.id === 1)?.status).toBe(
      "leave",
    );
    expect(entry.employees.find((item) => item.employee.id === 2)?.status).toBe(
      "holiday",
    );
  });

  it("uses attendance before leave", () => {
    const days = build({
      attendance: [attendance(1, "2026-10-06 09:00:00")],
      leaves: [leave(1, "2026-10-06", "2026-10-06")],
    });

    expect(day(days, "2026-10-06").state).toBe("recorded");
  });

  it("marks today as partial when only some employees have recorded", () => {
    const days = build({ attendance: [attendance(1, "2026-10-20 09:00:00")] });

    expect(day(days, "2026-10-20")).toMatchObject({
      state: "partial",
      counts: { present: 1, pending: 1, absent: 0 },
    });
  });

  it("labels a partial day using recorded attendance rather than leave", () => {
    const days = build({
      employees: [
        ...employees,
        {
          id: 3,
          first_name: "Cara",
          last_name: "Diaz",
          is_active: 1,
          is_archived: 0,
        },
      ],
      attendance: [attendance(1, "2026-10-20 09:00:00")],
      leaves: [leave(2, "2026-10-20", "2026-10-20")],
    });

    const today = day(days, "2026-10-20");

    expect(today.state).toBe("partial");
    expect(getDayStateLabel(today)).toBe("1 of 3 recorded");
  });

  it("marks future weekdays as no record", () => {
    expect(day(build(), "2026-10-21").state).toBe("none");
  });

  it("counts late attendance separately from present attendance", () => {
    const days = build({
      attendance: [attendance(1, "2026-10-07 09:15:00", "Late")],
    });

    expect(day(days, "2026-10-07")).toMatchObject({
      state: "recorded",
      counts: { late: 1, present: 0, recorded: 1, absent: 1 },
    });
  });

  it("ignores inactive and archived employees", () => {
    const days = build({
      employees: [
        ...employees,
        {
          id: 3,
          first_name: "Inactive",
          last_name: "User",
          is_active: 0,
          is_archived: 0,
        },
        {
          id: 4,
          first_name: "Archived",
          last_name: "User",
          is_active: 1,
          is_archived: 1,
        },
      ],
    });

    expect(day(days, "2026-10-01").counts.total).toBe(2);
  });

  it("records attendance even on a weekend", () => {
    const days = build({
      attendance: [attendance(1, "2026-10-03 09:00:00")],
    });

    expect(day(days, "2026-10-03")).toMatchObject({
      state: "recorded",
      isWeekend: true,
    });
  });

  it("returns the holiday name as the day label", () => {
    const days = build({ holidays: [holiday("2026-10-05", "Founders Day")] });

    expect(getDayStateLabel(day(days, "2026-10-05"))).toBe("Founders Day");
  });
});

describe("formatTime", () => {
  it("formats a clock timestamp in 12-hour time", () => {
    expect(formatTime("2026-10-01 21:57:36")).toBe("9:57 PM");
  });

  it("uses a dash for a missing timestamp", () => {
    expect(formatTime(null)).toBe("—");
  });
});
