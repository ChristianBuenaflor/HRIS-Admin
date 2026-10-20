export interface Employee {
  id: number;
  employee_id?: string | null;
  first_name: string;
  last_name: string;
  profile_picture?: string | null;
  department?: { name?: string | null } | string | null;
  position?: { name?: string | null } | string | null;
  is_active?: number | boolean | string | null;
  is_archived?: number | boolean | string | null;
}

export type AttendanceStatus = "present" | "late" | "missed" | "absent";

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  clock_in: string | null;
  clock_out: string | null;
  hours_worked?: string | number | null;
  status: string;
  employee?: Employee;
}

export interface LeaveRecord {
  id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  status: string;
  is_archived?: number | boolean | string | null;
  reason?: string | null;
  leave_type?: { leave_name?: string | null } | string | null;
  leaveType?: { leave_name?: string | null } | string | null;
}

export interface HolidayRecord {
  id: number;
  holiday_date: string;
  holiday_name: string;
  holiday_type?: string | { type_name?: string | null } | null;
  is_archived?: number | boolean | string | null;
}

export type EmployeeDayStatus =
  | "present"
  | "late"
  | "missed"
  | "absent"
  | "leave"
  | "holiday"
  | "weekend"
  | "none";

export interface EmployeeDay {
  employee: Employee;
  status: EmployeeDayStatus;
  attendance?: AttendanceRecord;
  leave?: LeaveRecord;
  holiday?: HolidayRecord;
}

export interface CalendarCounts {
  present: number;
  late: number;
  missed: number;
  leave: number;
  absent: number;
  pending: number;
  recorded: number;
  total: number;
}

export type CalendarDayState =
  | "recorded"
  | "partial"
  | "all-absent"
  | "none"
  | "weekend"
  | "holiday"
  | "leave";

export interface CalendarDay {
  date: string;
  dayNumber: number;
  weekday: number;
  isToday: boolean;
  isWeekend: boolean;
  state: CalendarDayState;
  counts: CalendarCounts;
  holiday?: HolidayRecord;
  employees: EmployeeDay[];
}

export interface AttendanceCalendarData {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRecord[];
  holidays: HolidayRecord[];
  warnings: string[];
}
