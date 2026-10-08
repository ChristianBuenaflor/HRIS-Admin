import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Download, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const API_BASE_URL = "https://api-hris.slarenasitsolutions.com/public/api";
const getToken = () => localStorage.getItem("token") ?? "";

interface Employee {
  id: number;
  profile_picture: string | null;
  first_name: string;
  last_name: string;
  email: string;
  department_id: number;
  position_id: number;
}

interface AttendanceRecord {
  id: number;
  employee_id: number;
  clock_in: string;
  clock_out: string | null;
  adjusted_clock_in: string | null;
  adjusted_clock_out: string | null;
  adjustment_reason: string | null;
  adjustment_status: string;
  adjusted_by: number | null;
  hours_worked: string;
  status: string;
  remarks: string | null;
  method: string;
  clock_in_image: string | null;
  clock_out_image: string | null;
  created_at: string;
  updated_at: string;
  employee: Employee;
}

interface AttendanceResponse {
  isSuccess: boolean;
  data: AttendanceRecord[];
}

const AttendanceTracker = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | "">("");
  const [selectedMonth, setSelectedMonth] = useState<number | "">("");
  const [selectedYear, setSelectedYear] = useState<number | "">("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Image Preview State
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");

  const fetchAttendance = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/attendances`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data: AttendanceResponse = await response.json();

      if (data.isSuccess) {
        setAttendance(data.data);
      } else {
        setError("Failed to fetch attendance data");
      }
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setError("Failed to fetch attendance data");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/employees`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchEmployees();
  }, []);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "present":
        return "default";
      case "missed":
        return "secondary";
      case "absent":
        return "destructive";
      case "half-day":
        return "outline";
      default:
        return "default";
    }
  };

  const formatHoursWorked = (hours: string) => {
    const totalHours = parseFloat(hours);
    if (isNaN(totalHours)) return "--";
    const h = Math.floor(totalHours);
    const m = Math.round((totalHours - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatTime = (time: string | null) => {
    if (!time) return "--";
    return format(new Date(time), "hh:mm a");
  };

  const getEmployeeName = (employee: Employee) =>
    `${employee.first_name} ${employee.last_name}`;

  // --- Filtered Attendance for Table (by single selected date) ---
  const filteredAttendance = attendance.filter((record) => {
    const recordDate = format(new Date(record.clock_in), "yyyy-MM-dd");
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
    return recordDate === selectedDateStr;
  });

  // --- Filtered Attendance for Export (by employee/month/year) ---
  const filteredExportAttendance = attendance.filter((record) => {
    const recordDate = new Date(record.clock_in);
    const monthMatch = selectedMonth
      ? recordDate.getMonth() + 1 === selectedMonth
      : true;
    const yearMatch = selectedYear
      ? recordDate.getFullYear() === selectedYear
      : true;
    const employeeMatch = selectedEmployee
      ? record.employee.id === selectedEmployee
      : true;
    return monthMatch && yearMatch && employeeMatch;
  });

  // const attendanceStats = {
  //   totalEmployees: filteredAttendance.length,
  //   present: filteredAttendance.filter(
  //     (a) => a.status.toLowerCase() === "present",
  //   ).length,
  //   late: filteredAttendance.filter((a) => a.status.toLowerCase() === "late")
  //     .length,
  //   absent: filteredAttendance.filter(
  //     (a) => a.status.toLowerCase() === "absent",
  //   ).length,
  //   halfDay: filteredAttendance.filter(
  //     (a) => a.status.toLowerCase() === "half-day",
  //   ).length,
  // };

  const handleExportAttendance = () => {
    const headers = [
      "Employee",
      "Date",
      "Clock In",
      "Clock Out",
      "Hours Worked",
      "Status",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredExportAttendance.map((record) =>
        [
          getEmployeeName(record.employee),
          format(new Date(record.clock_in), "yyyy-MM-dd"),
          formatTime(record.clock_in),
          record.clock_out ? formatTime(record.clock_out) : "N/A",
          record.hours_worked,
          record.status,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-export.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Attendance Tracker</h1>
        <div className="flex space-x-2">
          {/* Calendar Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" onClick={fetchAttendance}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          {/* Export Modal */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-6 space-y-6">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">
                  Export Attendance
                </DialogTitle>
                <DialogDescription>
                  Select filters to export specific attendance records as CSV
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-4">
                {/* Employee Dropdown */}
                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    Employee
                  </label>
                  <Select
                    value={selectedEmployee.toString() || undefined}
                    onValueChange={(val) => setSelectedEmployee(Number(val))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Employees" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.first_name} {emp.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Month Dropdown */}
                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    Month
                  </label>
                  <Select
                    value={selectedMonth.toString() || undefined}
                    onValueChange={(val) => setSelectedMonth(Number(val))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Months" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <SelectItem key={m} value={m.toString()}>
                          {new Date(0, m - 1).toLocaleString("default", {
                            month: "long",
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Year Dropdown */}
                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    Year
                  </label>
                  <Select
                    value={selectedYear.toString() || undefined}
                    onValueChange={(val) => setSelectedYear(Number(val))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(
                        { length: 10 },
                        (_, i) => new Date().getFullYear() - i,
                      ).map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button className="w-full mt-4" onClick={handleExportAttendance}>
                Export CSV
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Attendance</CardTitle>
          <CardDescription>
            Attendance records for {format(selectedDate, "PPPP")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAttendance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No attendance records found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Captured Clock In/Out</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Hours Worked</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="align-middle">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          {record.employee.profile_picture ? (
                            <AvatarImage
                              src={
                                record.employee.profile_picture ||
                                `${API_BASE_URL}/api/profile-picture?name=${getEmployeeName(
                                  record.employee,
                                )}`
                              }
                              alt={getEmployeeName(record.employee)}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <AvatarFallback>
                              {getInitials(
                                record.employee.first_name,
                                record.employee.last_name,
                              )}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {getEmployeeName(record.employee)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {record.employee.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {record.clock_in_image ? (
                          <img
                            src={record.clock_in_image}
                            className="w-10 h-10 rounded object-cover cursor-pointer border"
                            onClick={() => {
                              setPreviewImage(record.clock_in_image!);
                              setPreviewTitle("Clock In Image");
                            }}
                          />
                        ) : (
                          <span className="me-4 ms-4">
                            --
                          </span>
                        )}

                        {record.clock_out_image ? (
                          <img
                            src={record.clock_out_image}
                            className="w-10 h-10 rounded object-cover cursor-pointer border"
                            onClick={() => {
                              setPreviewImage(record.clock_out_image!);
                              setPreviewTitle("Clock Out Image");
                            }}
                          />
                        ) : (
                          <span>
                            --
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatTime(record.clock_in)}</TableCell>
                    <TableCell>
                      {record.clock_out ? formatTime(record.clock_out) : "--"}
                    </TableCell>
                    <TableCell>
                      {formatHoursWorked(record.hours_worked)}
                    </TableCell>
                    <TableCell>
                      {record.clock_out === null && (
                        <Badge variant="secondary">On Duty</Badge>
                      )}
                      {record.clock_out !== null && (
                        <Badge variant={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewTitle}</DialogTitle>
          </DialogHeader>

          {previewImage && (
            <div className="flex justify-center">
              <img
                src={previewImage}
                className="max-h-[70vh] w-auto rounded-lg object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendanceTracker;
