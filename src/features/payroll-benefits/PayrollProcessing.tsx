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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BASE_URL_API } from "@/utils/BASE_URL_API";
import {
  Calculator,
  FileText,
  Download,
  Building2,
  Calendar,
  User,
  TrendingUp,
  Plus,
  Users,
  Filter,
  Search,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  CalendarDays,
  CreditCard,
  Banknote,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

// Updated Employee interface to include computed attendance fields
interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  base_salary: number;
  position: string;
  department: string;
  employment_status: string;
  // Fields returned from the attendance‑aware endpoint
  days_worked?: number;
  absences?: number;
}

interface PayrollPeriod {
  id: string;
  period_name: string;
  pay_date: string;
  cutoff_start_date: string;
  cutoff_end_date: string;
  status: "draft" | "processed";
  payroll_records?: any[];
}

interface PayrollRecord {
  id: string;
  employee?: {
    id: string;
    employee_id?: string;
    first_name: string;
    last_name: string;
    email?: string;
    department?: string;
    position?: string;
    base_salary?: number | string;
  };
  attendance: {
    daily_rate: number | string;
    days_worked: number;
    absences: number;
    total_late_minutes: number;
    overtime_hours: number;
  };
  earnings: {
    gross_base: number | string;
    total_allowances: number | string;
    overtime_hours: number | string;
    night_diff_pay: number | string;
    holiday_pay: number | string;
    gross_pay: number | string;
  };
  deductions: {
    total_loan_deductions: number | string;
    total_late_deductions: number | string;
    total_deductions: number | string;
  };
  payroll: {
    gross_pay: number | string;
    total_deductions: number | string;
    net_pay: number | string;
  };
  remarks?: string;
}

interface PayrollSummary {
  total_periods: number;
  processed: number;
  drafts: number;
  active_employees: number;
}

interface PayrollEmployeeData {
  employee_id: number;
  days_worked: number;
  absences: number;
}

interface PayslipData {
  employee_name: string;
  employee_id: string;
  employee_department?: string;
  employee_position?: string;
  period_name: string;
  period: string;
  pay_date: string;
  daily_rate: number;
  days_worked: number;
  base_pay: number;
  overtime_hours: number;
  overtime_pay: number;
  holiday_pay: number;
  night_diff_pay: number;
  gross_base: number;
  total_allowances: number;
  gross_pay: number;
  total_loan_deductions: number;
  total_late_deductions: number;
  total_deductions: number;
  net_pay: number;
  paid_leave_days: number;
  paid_leave_amount: number;
  allowances: Array<{ allowance_type: string; allowance_amount: string }>;
  deductions: Array<{
    deduction_type: string;
    deduction_amount: string;
    loan_name?: string;
  }>;
  paid_leaves: Array<{
    leave_type: string;
    start_date: string;
    end_date: string;
    days: number;
    amount: string;
    reason?: string;
  }>;
  holidays: Array<{
    holiday_id: number | string;
    date: string;
    title?: string | null;
    holiday_type?: string | null;
  }>;
  generated_at: string;
  remarks?: string | null;
}

// API Service Functions
const payrollAPI = {
  // Create new payroll period
  async createPayrollPeriod(periodData: {
    period_name: string;
    pay_date: string;
    cutoff_start_date: string;
    cutoff_end_date: string;
    employees: PayrollEmployeeData[];
  }) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL_API}/payroll/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(periodData),
    });
    return await response.json();
  },

  // Update payroll period
  async updatePayrollPeriod(
    periodId: string,
    periodData: {
      period_name: string;
      pay_date: string;
      cutoff_start_date: string;
      cutoff_end_date: string;
    },
  ) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL_API}/payroll/update/${periodId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(periodData),
    });
    return await response.json();
  },

  // Archive payroll period
  async archivePayrollPeriod(periodId: string) {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${BASE_URL_API}/payroll/archive/${periodId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return await response.json();
  },

  // Get all payroll periods
  async getPayrollPeriods() {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL_API}/payroll/periods`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return await response.json();
  },

  // Get payroll details for a period
  async getPayrollDetails(
    periodId: string,
    page = 1,
    perPage = 5,
    search = "",
  ) {
    const token = localStorage.getItem("token");
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    if (search.trim()) params.set("search", search.trim());

    const response = await fetch(
      `${BASE_URL_API}/payroll/details/${periodId}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return await response.json();
  },

  // Get payroll summary
  async getPayrollSummary() {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL_API}/payroll/summary`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return await response.json();
  },

  // Process payroll period
  async processPayroll(periodId: string) {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${BASE_URL_API}/payroll/process/${periodId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return await response.json();
  },

  // Get payslip
  async getPayslip(recordId: string) {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${BASE_URL_API}/payroll/payslip/${recordId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return await response.json();
  },

  // ** NEW ** Get employees with computed attendance for a given cutoff range
  async getEmployeesWithAttendance(
    cutoff_start_date: string,
    cutoff_end_date: string,
  ) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL_API}/payroll/employees`, {
      method: "POST", // Backend expects POST with dates in the body
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        cutoff_start_date,
        cutoff_end_date,
      }),
    });
    return await response.json();
  },
};

export function PayrollProcessing() {
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(
    null,
  );
  const [periodDetails, setPeriodDetails] = useState<PayrollRecord[]>([]);
  const [showPayslip, setShowPayslip] = useState<PayslipData | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [recordSearch, setRecordSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [totalGross, setTotalGross] = useState(0);
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [totalNet, setTotalNet] = useState(0);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });

  const [newPayrollPeriod, setNewPayrollPeriod] = useState({
    period_name: "",
    pay_date: "",
    cutoff_start_date: "",
    cutoff_end_date: "",
  });
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [employeeAttendance, setEmployeeAttendance] = useState<
    Record<
      string,
      {
        days_worked: number;
        absences: number;
        remarks?: string;
      }
    >
  >({});

  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary>({
    total_periods: 0,
    processed: 0,
    drafts: 0,
    active_employees: 0,
  });
  const [employees, setEmployees] = useState<Employee[]>([]); // Now used exclusively for the dialog

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<PayrollPeriod | null>(
    null,
  );
  const [deletingPeriod, setDeletingPeriod] = useState<PayrollPeriod | null>(
    null,
  );
  const [editFormData, setEditFormData] = useState({
    period_name: "",
    pay_date: "",
    cutoff_start_date: "",
    cutoff_end_date: "",
  });

  // ** NEW ** Loading state for employee attendance fetch
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Edit handlers
  const handleEditClick = (period: PayrollPeriod) => {
    setEditingPeriod(period);
    setEditFormData({
      period_name: period.period_name,
      pay_date: period.pay_date.split("T")[0],
      cutoff_start_date: period.cutoff_start_date.split("T")[0],
      cutoff_end_date: period.cutoff_end_date.split("T")[0],
    });
    setShowEditDialog(true);
  };

  const handleEditSubmit = async () => {
    if (!editingPeriod) return;

    try {
      const response = await payrollAPI.updatePayrollPeriod(
        editingPeriod.id,
        editFormData,
      );

      if (response.isSuccess) {
        toast.success("Payroll period updated successfully!");
        setShowEditDialog(false);
        setEditingPeriod(null);
        await loadData();
        if (selectedPeriod && selectedPeriod.id === editingPeriod.id) {
          setSelectedPeriod(response.data);
        }
      } else {
        throw new Error(response.message || "Failed to update payroll period");
      }
    } catch (error: any) {
      console.error("Error updating payroll period:", error);
      toast.error(error.message || "Failed to update payroll period");
    }
  };

  const handleDeleteClick = (period: PayrollPeriod) => {
    setDeletingPeriod(period);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPeriod) return;

    try {
      const response = await payrollAPI.archivePayrollPeriod(deletingPeriod.id);

      if (response.isSuccess) {
        toast.success("Payroll period archived successfully!");
        setShowDeleteDialog(false);
        setDeletingPeriod(null);
        await loadData();
        if (selectedPeriod && selectedPeriod.id === deletingPeriod.id) {
          setSelectedPeriod(null);
        }
      } else {
        throw new Error(response.message || "Failed to archive payroll period");
      }
    } catch (error: any) {
      console.error("Error archiving payroll period:", error);
      toast.error(error.message || "Failed to archive payroll period");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatMoney = (value: number | string | null | undefined) => {
    const numericValue = Number(String(value ?? 0).replace(/,/g, ""));

    return (Number.isFinite(numericValue) ? numericValue : 0).toLocaleString(
      "en-PH",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    );
  };

  // Load data on component mount – **NO LONGER** fetches employees here
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [periodsResponse, summaryResponse] = await Promise.all([
        payrollAPI.getPayrollPeriods(),
        payrollAPI.getPayrollSummary(),
        // Employees are no longer fetched globally; only fetched on demand in the dialog
      ]);

      if (periodsResponse.isSuccess) {
        setPayrollPeriods(periodsResponse.payrolls);
      } else {
        console.error(
          "Failed to load payroll periods:",
          periodsResponse.message,
        );
        toast.error(
          periodsResponse.message || "Failed to load payroll periods",
        );
      }

      if (summaryResponse.isSuccess) {
        setPayrollSummary(summaryResponse.data);
      } else {
        console.error(
          "Failed to load payroll summary:",
          summaryResponse.message,
        );
        toast.error(
          summaryResponse.message || "Failed to load payroll summary",
        );
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Load period details when a period is selected
  useEffect(() => {
    if (selectedPeriod) {
      loadPeriodDetails(selectedPeriod.id, 1);
    }
  }, [selectedPeriod]);

  const loadPeriodDetails = async (periodId: string, page: number = 1) => {
    try {
      const response = await payrollAPI.getPayrollDetails(
        periodId,
        page,
        pagination.per_page,
        recordSearch,
      );
      if (response.isSuccess) {
        setPeriodDetails(response.payrolldetails || []);
        setTotalGross(
          parseFloat(String(response.summary?.total_gross).replace(/,/g, "")) ||
            0,
        );
        setTotalDeductions(
          parseFloat(
            String(response.summary?.total_deductions).replace(/,/g, ""),
          ) || 0,
        );
        setTotalNet(
          parseFloat(String(response.summary?.total_net).replace(/,/g, "")) ||
            0,
        );

        if (response.pagination) {
          setPagination({
            current_page: response.pagination.current_page || page,
            last_page: response.pagination.last_page || 1,
            per_page: response.pagination.per_page || pagination.per_page,
            total: response.pagination.total || 0,
          });
        }
      } else {
        toast.error(response.message || "Failed to load period details");
      }
    } catch (error) {
      console.error("Error loading period details:", error);
      toast.error("Failed to load period details");
    }
  };

  useEffect(() => {
    if (selectedPeriod) {
      loadPeriodDetails(selectedPeriod.id, 1);
    }
  }, [recordSearch]);

  const fetchPayrollDetails = async (page: number) => {
    if (selectedPeriod) {
      await loadPeriodDetails(selectedPeriod.id, page);
    }
  };

  const handleDownloadPayslip = async () => {
    if (!showPayslip) {
      toast.error("No payslip data available");
      return;
    }

    try {
      const pdfData = {
        employee_name: showPayslip.employee_name,
        period: showPayslip.period,
        daily_rate: formatMoney(showPayslip.daily_rate),
        days_worked: String(showPayslip.days_worked),
        gross_base: formatMoney(showPayslip.gross_base),
        gross_pay: formatMoney(showPayslip.gross_pay),
        night_diff_pay: formatMoney(showPayslip.night_diff_pay),
        total_allowances: formatMoney(showPayslip.total_allowances),
        total_deductions: formatMoney(showPayslip.total_deductions),
        net_pay: formatMoney(showPayslip.net_pay),
        generated_at: showPayslip.pay_date,
        allowances: showPayslip.allowances,
        deductions: showPayslip.deductions,
        employee: {
          department: showPayslip.employee_department,
          position: showPayslip.employee_position,
          employee_id: showPayslip.employee_id,
        },
      };

      toast.loading("Generating PDF...", { id: "pdf-generation" });
      const { generatePayslipPDF } = await import("./utils/payslipPDFGenerator");
      await generatePayslipPDF(pdfData);
      toast.success("Payslip PDF downloaded successfully!", {
        id: "pdf-generation",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.", {
        id: "pdf-generation",
      });
    }
  };

  const handleViewPayslip = async (recordId: string) => {
    try {
      const response = await payrollAPI.getPayslip(recordId);
      if (response.isSuccess) {
        const payslip = response.data;
        const toNumber = (value: number | string | null | undefined) =>
          Number(String(value ?? 0).replace(/,/g, "")) || 0;

        if (!payslip) {
          throw new Error("Payslip data was not returned");
        }

        const normalizedPayslip: PayslipData = {
          employee_name: payslip.employee?.name || "N/A",
          employee_id: String(payslip.employee?.employee_id || "N/A"),
          period_name: payslip.payroll_period?.period_name || "N/A",
          period: payslip.payroll_period?.period_range || "N/A",
          pay_date: payslip.payroll_period?.pay_date || "N/A",
          daily_rate: toNumber(payslip.pay?.daily_rate),
          days_worked: toNumber(payslip.pay?.days_worked),
          base_pay: toNumber(payslip.pay?.base_pay),
          overtime_hours: toNumber(payslip.pay?.overtime_hours),
          overtime_pay: toNumber(payslip.pay?.overtime_pay),
          holiday_pay: toNumber(payslip.pay?.holiday_pay),
          night_diff_pay: toNumber(payslip.pay?.night_diff_pay),
          gross_base: toNumber(payslip.summary?.gross_base),
          total_allowances: toNumber(payslip.summary?.total_allowances),
          gross_pay: toNumber(payslip.summary?.gross_pay),
          total_loan_deductions: toNumber(
            payslip.summary?.total_loan_deductions,
          ),
          total_late_deductions: toNumber(
            payslip.summary?.total_late_deductions,
          ),
          total_deductions: toNumber(payslip.summary?.total_deductions),
          net_pay: toNumber(payslip.summary?.net_pay),
          paid_leave_days: toNumber(payslip.summary?.paid_leave_days),
          paid_leave_amount: toNumber(payslip.summary?.paid_leave_amount),
          employee_department: payslip.employee?.department,
          employee_position: payslip.employee?.position,
          allowances: payslip.allowances || [],
          deductions: payslip.deductions || [],
          paid_leaves: payslip.paid_leaves || [],
          holidays: payslip.holidays || [],
          generated_at: payslip.payroll_period?.pay_date || "N/A",
          remarks: payslip.remarks,
        };

        setShowPayslip(normalizedPayslip);
      } else {
        toast.error(response.message || "Failed to load payslip");
      }
    } catch (error) {
      console.error("Error loading payslip:", error);
      toast.error("Failed to load payslip");
    }
  };

  const handleExportToExcel = async () => {
    if (!selectedPeriod) {
      toast.error("Please select a payroll period to export.");
      return;
    }

    setLoading(true);
    try {
      const XLSX = await import("xlsx");
      const { saveAs } = await import("file-saver");
      const response = await payrollAPI.getPayrollDetails(
        selectedPeriod.id,
        1,
        100,
      );

      if (!response.isSuccess) {
        toast.error(
          response.message || "Failed to fetch payroll data for export.",
        );
        return;
      }

      const payrollData = response.payrolldetails || [];

      const dataToExport = payrollData.map((record: any) => ({
        "Employee Name":
          `${record.employee?.first_name || ""} ${record.employee?.last_name || ""}`.trim() ||
          "N/A",
        Department:
          record.employee?.department || "N/A",
        Position:
          record.employee?.position || "N/A",
        "Daily Rate": record.attendance?.daily_rate,
        "Days Worked": record.attendance?.days_worked,
        Absences: record.attendance?.absences,
        "Gross Base": record.earnings?.gross_base,
        "Gross Pay": record.payroll?.gross_pay,
        "Total Deductions": record.payroll?.total_deductions,
        "Net Pay": record.payroll?.net_pay,
        Remarks: record.remarks || "No remarks",
        "Payroll Period": selectedPeriod.period_name,
        "Pay Date": formatDate(selectedPeriod.pay_date),
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const colWidths = [
        { wch: 30 },
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 30 },
        { wch: 30 },
        { wch: 20 },
      ];
      ws["!cols"] = colWidths;

      const range = XLSX.utils.decode_range(ws["!ref"] || "A1:M1");
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[address]) continue;
        ws[address].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4F46E5" } },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }

      const numericColumns = ["D", "E", "F", "G", "H", "I", "J"];
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        numericColumns.forEach((col) => {
          const address = col + (R + 1);
          if (ws[address]) {
            ws[address].s = {
              numFmt: '"₱"#,##0.00',
              alignment: { horizontal: "right" },
            };
          }
        });
      }

      const wb = XLSX.utils.book_new();
      const sheetName = `Payroll - ${selectedPeriod.period_name}`.substring(
        0,
        31,
      );
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const excelData = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const fileName = `Payroll_${selectedPeriod.period_name.replace(/\s/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;
      saveAs(excelData, fileName);

      toast.success("Payroll data exported to Excel successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export payroll data to Excel.");
    } finally {
      setLoading(false);
    }
  };

  // ** NEW ** Fetch employees with attendance when both cutoff dates are set
  const fetchEmployeesWithAttendance = async () => {
    if (
      !newPayrollPeriod.cutoff_start_date ||
      !newPayrollPeriod.cutoff_end_date
    ) {
      return;
    }

    setLoadingEmployees(true);
    try {
      const response = await payrollAPI.getEmployeesWithAttendance(
        newPayrollPeriod.cutoff_start_date,
        newPayrollPeriod.cutoff_end_date,
      );

      if (response.isSuccess) {
        // The current attendance endpoint returns the employee list in `employees`.
        const employees = Array.isArray(response.employees)
          ? response.employees
          : Array.isArray(response.data)
            ? response.data
            : [];
        const mappedEmployees = employees.map((emp: any) => {
          const firstName = emp.first_name || "";
          const lastName = emp.last_name || "";
          const department =
            typeof emp.department === "string"
              ? emp.department
              : emp.department?.department_name || "N/A";
          const position =
            typeof emp.position === "string"
              ? emp.position
              : emp.position?.position_name || "N/A";

          return {
            id: emp.id?.toString() || "",
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`.trim(),
            base_salary: Number(emp.base_salary) || 0,
            position,
            department,
            employment_status: "active",
            days_worked: Number(emp.days_worked) || 0,
            absences: Number(emp.absences) || 0,
          };
        });

        setEmployees(mappedEmployees);
      } else {
        toast.error(
          response.message || "Failed to load employee attendance data",
        );
      }
    } catch (error) {
      console.error("Error fetching employees with attendance:", error);
      toast.error("Failed to load employee data");
    } finally {
      setLoadingEmployees(false);
    }
  };

  // ** NEW ** Auto-fetch when cutoff dates change and dialog is open
  useEffect(() => {
    if (showGenerateDialog) {
      fetchEmployeesWithAttendance();
    }
  }, [
    newPayrollPeriod.cutoff_start_date,
    newPayrollPeriod.cutoff_end_date,
    showGenerateDialog,
  ]);

  // ** NEW ** Reset dialog state when opened/closed
  useEffect(() => {
    if (showGenerateDialog) {
      // Clear previous selections
      setSelectedEmployees([]);
      setEmployeeAttendance({});
      // If dates are already filled, fetch immediately
      if (
        newPayrollPeriod.cutoff_start_date &&
        newPayrollPeriod.cutoff_end_date
      ) {
        fetchEmployeesWithAttendance();
      }
    } else {
      // Optionally clear the employee list when dialog closes
      // setEmployees([]);
    }
  }, [showGenerateDialog]);

  const handleToggleEmployee = (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    if (selectedEmployees.includes(employeeId)) {
      setSelectedEmployees(selectedEmployees.filter((id) => id !== employeeId));
      const newAttendance = { ...employeeAttendance };
      delete newAttendance[employeeId];
      setEmployeeAttendance(newAttendance);
    } else {
      setSelectedEmployees([...selectedEmployees, employeeId]);
      // Pre-fill with computed attendance from backend, fallback to 13/0
      setEmployeeAttendance({
        ...employeeAttendance,
        [employeeId]: {
          days_worked: employee?.days_worked ?? 13,
          absences: employee?.absences ?? 0,
        },
      });
    }
  };

  const handleUpdateAttendance = (
    employeeId: string,
    field: string,
    value: string | number,
  ) => {
    setEmployeeAttendance({
      ...employeeAttendance,
      [employeeId]: {
        ...employeeAttendance[employeeId],
        [field]: value,
      },
    });
  };

  const handleGeneratePayroll = async () => {
    if (selectedEmployees.length === 0) {
      toast.error("Please select at least one employee");
      return;
    }

    if (
      !newPayrollPeriod.period_name ||
      !newPayrollPeriod.cutoff_start_date ||
      !newPayrollPeriod.cutoff_end_date ||
      !newPayrollPeriod.pay_date
    ) {
      toast.error("Please fill in all period details");
      return;
    }

    setProcessing(true);
    try {
      const payrollData = {
        period_name: newPayrollPeriod.period_name,
        pay_date: newPayrollPeriod.pay_date,
        cutoff_start_date: newPayrollPeriod.cutoff_start_date,
        cutoff_end_date: newPayrollPeriod.cutoff_end_date,
        employees: selectedEmployees.map((empId) => {
          const attendance = employeeAttendance[empId];
          return {
            employee_id: parseInt(empId),
            days_worked: attendance?.days_worked || 0,
            absences: attendance?.absences || 0,
            remarks: attendance?.remarks || "",
          };
        }),
      };

      const response = await payrollAPI.createPayrollPeriod(payrollData);

      if (response.isSuccess) {
        toast.success("Payroll period created successfully!");
        setShowGenerateDialog(false);

        // Reset form
        setSelectedEmployees([]);
        setEmployeeAttendance({});
        setNewPayrollPeriod({
          period_name: "",
          pay_date: "",
          cutoff_start_date: "",
          cutoff_end_date: "",
        });
        setEmployees([]); // Clear employee list

        await loadData();
      } else {
        throw new Error(response.message || "Failed to create payroll period");
      }
    } catch (error: any) {
      console.error("Error creating payroll period:", error);
      toast.error(error.message || "Failed to create payroll period");
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessPayroll = async (periodId: string) => {
    setProcessing(true);
    try {
      const response = await payrollAPI.processPayroll(periodId);

      if (response.isSuccess) {
        toast.success("Payroll processed successfully!");
        await loadData();
      } else {
        throw new Error(response.message || "Failed to process payroll");
      }
    } catch (error: any) {
      console.error("Error processing payroll:", error);
      toast.error(error.message || "Failed to process payroll");
    } finally {
      setProcessing(false);
    }
  };

  const filteredPeriods = payrollPeriods.filter((period) => {
    const matchesStatus =
      filterStatus === "all" || period.status === filterStatus;
    const matchesSearch =
      period.period_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      period.id.toString().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading payroll data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Payroll Management
          </h1>
          <p className="text-muted-foreground">
            Process semi-monthly payroll with automatic government contributions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportToExcel}
            className="gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </Button>
          <Button onClick={() => setShowGenerateDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Payroll Period
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* ... unchanged ... */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  Total Periods
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {payrollSummary.total_periods}
                </p>
              </div>
              <div className="p-2 bg-blue-600 rounded-lg">
                <CalendarDays className="size-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Processed</p>
                <p className="text-2xl font-bold text-green-900">
                  {payrollSummary.processed}
                </p>
              </div>
              <div className="p-2 bg-green-600 rounded-lg">
                <CheckCircle2 className="size-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Drafts</p>
                <p className="text-2xl font-bold text-amber-900">
                  {payrollSummary.drafts}
                </p>
              </div>
              <div className="p-2 bg-amber-600 rounded-lg">
                <Clock className="size-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">
                  Active Employees
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {payrollSummary.active_employees}
                </p>
              </div>
              <div className="p-2 bg-purple-600 rounded-lg">
                <Users className="size-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Summary - Only show when period is selected */}
      {selectedPeriod && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payroll Summary - {selectedPeriod.period_name}
                </CardTitle>
                <CardDescription>
                  Cutoff: {formatDate(selectedPeriod.cutoff_start_date)} to{" "}
                  {formatDate(selectedPeriod.cutoff_end_date)} • Pay Date:{" "}
                  {formatDate(selectedPeriod.pay_date)}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPeriod(null)}
                >
                  Back to List
                </Button>
                {selectedPeriod.status === "draft" && (
                  <Button
                    onClick={() => handleProcessPayroll(selectedPeriod.id)}
                    disabled={processing}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Process Payroll
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Gross Pay
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        ₱
                        {totalGross.toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Deductions
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        ₱
                        {totalDeductions.toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <Calculator className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Net Pay
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        ₱
                        {totalNet.toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <Banknote className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Employee Table */}
            <div className="border rounded-lg">
              <div className="p-4 bg-muted/50 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Employee Payroll Records ({pagination.total} employees)
                </h3>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    className="pl-9 bg-background"
                    value={recordSearch}
                    onChange={(event) => setRecordSearch(event.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="min-w-[200px]">Employee</TableHead>
                      <TableHead className="min-w-[150px]">
                        Department
                      </TableHead>
                      <TableHead className="min-w-[120px]">Position</TableHead>
                      <TableHead className="min-w-[100px]">
                        Daily Rate
                      </TableHead>
                      <TableHead className="min-w-[100px]">
                        Days Worked
                      </TableHead>
                      <TableHead className="min-w-[100px]">Absences</TableHead>
                      <TableHead className="min-w-[140px]">
                        Gross Base
                      </TableHead>
                      <TableHead className="min-w-[140px]">Gross Pay</TableHead>
                      <TableHead className="min-w-[140px]">
                        Total Deductions
                      </TableHead>
                      <TableHead className="min-w-[140px]">Net Pay</TableHead>
                      <TableHead className="min-w-[200px]">Remarks</TableHead>
                      <TableHead className="min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {periodDetails.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={12}
                          className="text-center py-8 text-muted-foreground"
                        >
                          <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No payroll records found</p>
                          <p className="text-sm">
                            Process payroll to see employee records
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      periodDetails.map((record) => (
                        <TableRow key={record.id} className="hover:bg-muted/50">
                          <TableCell className="min-w-[200px] font-medium">
                            <div className="flex flex-col">
                              <span>
                                {record.employee?.first_name}{" "}
                                {record.employee?.last_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ID: {record.employee?.employee_id || record.employee?.id || "N/A"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[150px]">
                            {record.employee?.department || "N/A"}
                          </TableCell>
                          <TableCell className="min-w-[120px]">
                            {record.employee?.position || "N/A"}
                          </TableCell>
                          <TableCell className="min-w-[100px]">
                            ₱{formatMoney(record.attendance.daily_rate)}
                          </TableCell>
                          <TableCell className="min-w-[100px] text-center">
                            {record.attendance.days_worked}
                          </TableCell>
                          <TableCell className="min-w-[100px] text-center">
                            {record.attendance.absences}
                          </TableCell>
                          <TableCell className="min-w-[140px]">
                            ₱{formatMoney(record.earnings.gross_base)}
                          </TableCell>
                          <TableCell className="min-w-[140px]">
                            ₱{formatMoney(record.payroll.gross_pay)}
                          </TableCell>
                          <TableCell className="min-w-[140px]">
                            ₱{formatMoney(record.payroll.total_deductions)}
                          </TableCell>
                          <TableCell className="min-w-[140px] font-semibold">
                            ₱{formatMoney(record.payroll.net_pay)}
                          </TableCell>
                          <TableCell className="min-w-[200px]">
                            {record.remarks ? (
                              <div className="max-w-[200px]">
                                <p
                                  className="text-sm line-clamp-2"
                                  title={record.remarks}
                                >
                                  {record.remarks}
                                </p>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">
                                No remarks
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="min-w-[100px]">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewPayslip(record.id)}
                              title="View Payslip"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t">
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  {(pagination.current_page - 1) * pagination.per_page + 1} to{" "}
                  {Math.min(
                    pagination.current_page * pagination.per_page,
                    pagination.total,
                  )}{" "}
                  of {pagination.total} employees
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.current_page === 1}
                  onClick={() =>
                    fetchPayrollDetails(pagination.current_page - 1)
                  }
                >
                  Previous
                </Button>
                {Array.from(
                  { length: Math.min(5, pagination.last_page) },
                  (_, i) => {
                    let pageNum;
                    if (pagination.last_page <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.current_page <= 3) {
                      pageNum = i + 1;
                    } else if (
                      pagination.current_page >=
                      pagination.last_page - 2
                    ) {
                      pageNum = pagination.last_page - 4 + i;
                    } else {
                      pageNum = pagination.current_page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={
                          pagination.current_page === pageNum
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => fetchPayrollDetails(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  },
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.current_page === pagination.last_page}
                  onClick={() =>
                    fetchPayrollDetails(pagination.current_page + 1)
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payroll Periods List */}
      {!selectedPeriod && (
        <Card>
          <CardHeader>
            <CardTitle>Payroll Period History</CardTitle>
            <CardDescription>
              Manage and review all payroll periods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search payroll periods..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Periods Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPeriods.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No payroll periods found</p>
                  <p className="text-sm">
                    Create your first payroll period to get started
                  </p>
                </div>
              ) : (
                filteredPeriods.map((period) => (
                  <Card
                    key={period.id}
                    className={`hover:shadow-md transition-shadow ${
                      period.status === "draft"
                        ? "border-amber-200 bg-amber-50/50"
                        : "bg-green-50/50 border-green-200"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base">
                            {period.period_name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {period.payroll_records?.length || 0} employees
                          </CardDescription>
                        </div>
                        <Badge
                          variant={
                            period.status === "processed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {period.status === "processed"
                            ? "Processed"
                            : "Draft"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <div className="flex flex-col justify-between h-full">
                      <CardContent className="pb-3">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Cutoff:
                            </span>
                            <span>
                              {formatDate(period.cutoff_start_date)} -{" "}
                              {formatDate(period.cutoff_end_date)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Pay Date:
                            </span>
                            <span className="font-medium">
                              {formatDate(period.pay_date)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardContent className="pt-0">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1"
                            onClick={() => setSelectedPeriod(period)}
                          >
                            <FileText className="w-3 h-3" />
                            View
                          </Button>
                          {period.status === "draft" && (
                            <>
                              <Button
                                size="sm"
                                className="flex-1 gap-1"
                                onClick={() => handleProcessPayroll(period.id)}
                                disabled={processing}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Process
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditClick(period)}
                                className="px-2"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick(period)}
                                className="px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Payroll Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="md:min-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Payroll Period
            </DialogTitle>
            <DialogDescription>
              Set up a new payroll period and select employees to include
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Period Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Period Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="period-name">Period Name *</Label>
                    <Input
                      id="period-name"
                      placeholder="e.g., February 16-28, 2025"
                      value={newPayrollPeriod.period_name}
                      onChange={(e) =>
                        setNewPayrollPeriod((prev) => ({
                          ...prev,
                          period_name: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pay-date">Pay Date *</Label>
                    <Input
                      type="date"
                      id="pay-date"
                      value={newPayrollPeriod.pay_date}
                      onChange={(e) =>
                        setNewPayrollPeriod((prev) => ({
                          ...prev,
                          pay_date: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cutoff-start">Cutoff Start *</Label>
                    <Input
                      type="date"
                      id="cutoff-start"
                      value={newPayrollPeriod.cutoff_start_date}
                      onChange={(e) =>
                        setNewPayrollPeriod((prev) => ({
                          ...prev,
                          cutoff_start_date: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cutoff-end">Cutoff End *</Label>
                    <Input
                      type="date"
                      id="cutoff-end"
                      value={newPayrollPeriod.cutoff_end_date}
                      onChange={(e) =>
                        setNewPayrollPeriod((prev) => ({
                          ...prev,
                          cutoff_end_date: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                {/* Hint about auto‑computed attendance */}
                {newPayrollPeriod.cutoff_start_date &&
                  newPayrollPeriod.cutoff_end_date && (
                    <p className="text-xs text-green-600 mt-2">
                      ✅ Days worked and absences are automatically computed
                      from attendance records for this cutoff.
                    </p>
                  )}
              </CardContent>
            </Card>

            {/* Employee Selection */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Select Employees
                    </CardTitle>
                    <CardDescription>
                      {loadingEmployees ? (
                        <span className="text-muted-foreground">
                          Loading employee attendance...
                        </span>
                      ) : (
                        <span>
                          Select employees to include in this payroll period
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const allEmployeeIds = employees.map((emp) => emp.id);
                        setSelectedEmployees(allEmployeeIds);
                        const initialAttendance: Record<string, any> = {};
                        allEmployeeIds.forEach((id) => {
                          const emp = employees.find((e) => e.id === id);
                          initialAttendance[id] = {
                            days_worked: emp?.days_worked ?? 13,
                            absences: emp?.absences ?? 0,
                            remarks: "",
                          };
                        });
                        setEmployeeAttendance(initialAttendance);
                      }}
                      disabled={loadingEmployees || employees.length === 0}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedEmployees([]);
                        setEmployeeAttendance({});
                      }}
                      disabled={loadingEmployees}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="w-12 sticky left-0 bg-muted/50 z-10">
                              Select
                            </TableHead>
                            <TableHead className="min-w-[200px] sticky left-12 bg-muted/50 z-10">
                              Employee
                            </TableHead>
                            <TableHead className="min-w-[120px]">
                              Department
                            </TableHead>
                            <TableHead className="min-w-[100px]">
                              Daily Rate
                            </TableHead>
                            <TableHead className="min-w-[100px]">
                              Days Worked
                            </TableHead>
                            <TableHead className="min-w-[100px]">
                              Absences
                            </TableHead>
                            <TableHead className="min-w-[150px]">
                              Remarks
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loadingEmployees ? (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="text-center py-8 text-muted-foreground"
                              >
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                <p className="mt-2">
                                  Loading employee attendance data...
                                </p>
                              </TableCell>
                            </TableRow>
                          ) : employees.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="text-center py-8 text-muted-foreground"
                              >
                                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No employees found</p>
                                <p className="text-sm">
                                  Select cutoff dates to load employees
                                </p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            employees.map((employee) => {
                              const isSelected = selectedEmployees.includes(
                                employee.id,
                              );
                              const attendance = employeeAttendance[
                                employee.id
                              ] || {
                                days_worked: employee.days_worked ?? 13,
                                absences: employee.absences ?? 0,
                                remarks: "",
                              };

                              return (
                                <TableRow
                                  key={employee.id}
                                  className={
                                    isSelected ? "bg-blue-50" : "bg-muted/30"
                                  }
                                >
                                  <TableCell className="sticky left-0 bg-inherit z-10">
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() =>
                                        handleToggleEmployee(employee.id)
                                      }
                                    />
                                  </TableCell>
                                  <TableCell className="sticky left-12 bg-inherit z-10 min-w-[200px]">
                                    <div className="flex items-center space-x-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback
                                          className={`${isSelected ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"}`}
                                        >
                                          {employee.first_name?.[0]}
                                          {employee.last_name?.[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="font-medium">
                                          {employee.first_name}{" "}
                                          {employee.last_name}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {employee.position || "N/A"}
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="min-w-[120px]">
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {employee.department || "N/A"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-medium min-w-[100px]">
                                    ₱
                                    {(employee.base_salary || 0).toLocaleString(
                                      "en-PH",
                                      { minimumFractionDigits: 2 },
                                    )}
                                  </TableCell>
                                  <TableCell className="min-w-[100px]">
                                    {isSelected ? (
                                      <Input
                                        type="number"
                                        id={`days-worked-${employee.id}`}
                                        className="w-20 text-center"
                                        value={attendance.days_worked}
                                        onChange={(e) =>
                                          handleUpdateAttendance(
                                            employee.id,
                                            "days_worked",
                                            Number(e.target.value),
                                          )
                                        }
                                      />
                                    ) : (
                                      <span className="text-muted-foreground">
                                        —
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="min-w-[100px]">
                                    {isSelected ? (
                                      <Input
                                        type="number"
                                        id={`absences-${employee.id}`}
                                        className="w-20 text-center"
                                        value={attendance.absences}
                                        onChange={(e) =>
                                          handleUpdateAttendance(
                                            employee.id,
                                            "absences",
                                            Number(e.target.value),
                                          )
                                        }
                                      />
                                    ) : (
                                      <span className="text-muted-foreground">
                                        —
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="min-w-[150px]">
                                    {isSelected ? (
                                      <Input
                                        placeholder="Optional remarks..."
                                        className="w-full"
                                        value={attendance.remarks || ""}
                                        onChange={(e) =>
                                          handleUpdateAttendance(
                                            employee.id,
                                            "remarks",
                                            e.target.value,
                                          )
                                        }
                                      />
                                    ) : (
                                      <span className="text-muted-foreground text-sm italic">
                                        —
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
                {selectedEmployees.length > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <p className="text-sm text-blue-800">
                          <strong>{selectedEmployees.length}</strong> of{" "}
                          <strong>{employees.length}</strong> employee(s)
                          selected
                        </p>
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800"
                        >
                          {Math.round(
                            (selectedEmployees.length / employees.length) * 100,
                          )}
                          % Selected
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGenerateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGeneratePayroll}
              disabled={
                selectedEmployees.length === 0 || processing || loadingEmployees
              }
            >
              <Plus className="w-4 h-4 mr-2" />
              {processing ? "Creating..." : "Create Payroll Period"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payroll Period Dialog */}
      <Dialog
        open={showEditDialog}
        onOpenChange={() => setShowEditDialog(false)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Payroll Period</DialogTitle>
            <DialogDescription>
              Update the payroll period details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-period-name">Period Name</Label>
              <Input
                id="edit-period-name"
                value={editFormData.period_name}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    period_name: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-pay-date">Pay Date</Label>
              <Input
                type="date"
                id="edit-pay-date"
                value={editFormData.pay_date}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    pay_date: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cutoff-start">Cutoff Start Date</Label>
              <Input
                type="date"
                id="edit-cutoff-start"
                value={editFormData.cutoff_start_date}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    cutoff_start_date: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cutoff-end">Cutoff End Date</Label>
              <Input
                type="date"
                id="edit-cutoff-end"
                value={editFormData.cutoff_end_date}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    cutoff_end_date: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit}>Update Period</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={() => setShowDeleteDialog(false)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Archive Payroll Period</DialogTitle>
            <DialogDescription>
              Are you sure you want to archive this payroll period? This action
              will also archive all related payroll records.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <span className="text-sm font-medium">
                This action cannot be undone.
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Archive Period
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payslip Modal */}
      {showPayslip && (
        <Dialog open={!!showPayslip} onOpenChange={() => setShowPayslip(null)}>
          <DialogContent className="min-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Employee Payslip</DialogTitle>
              <DialogDescription>
                Compensation statement for {showPayslip.employee_name}
              </DialogDescription>
            </DialogHeader>

            {/* Payslip Content */}
            <div className="bg-white p-8 border-2 rounded-lg space-y-6">
              {/* Header */}
              <div className="text-center border-b-2 pb-6">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Building2 className="w-8 h-8 text-primary" />
                  <h2 className="text-2xl font-bold text-primary">
                    SNL Technology
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  123 Business Avenue, Makati City, Metro Manila 1200
                </p>
                <h3 className="text-xl font-semibold mt-4 text-primary">
                  EMPLOYEE PAYSLIP
                </h3>
              </div>

              {/* Employee & Period Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Employee Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">
                        {showPayslip.employee_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Employee ID:</span>
                      <span className="font-medium">
                        {showPayslip.employee_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Period:</span>
                      <span className="font-medium">
                        {showPayslip.period_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cutoff:</span>
                      <span className="font-medium">{showPayslip.period}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Daily Rate:</span>
                      <span className="font-medium">
                        ₱{formatMoney(showPayslip.daily_rate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Days Worked:
                      </span>
                      <span className="font-medium">
                        {showPayslip.days_worked}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Payment Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Base Salary:
                      </span>
                      <span className="font-medium">
                        ₱{formatMoney(showPayslip.base_pay)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Total Deductions:
                      </span>
                      <span className="font-medium text-red-500">
                        ₱{formatMoney(showPayslip.total_deductions)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Total Allowances:
                      </span>
                      <span className="font-medium text-green-500">
                        ₱{formatMoney(showPayslip.total_allowances)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Night Differential:
                      </span>
                      <span className="font-medium text-green-500">
                        ₱{formatMoney(showPayslip.night_diff_pay)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Net Pay:</span>
                      <span className="font-medium text-blue-600">
                        ₱{formatMoney(showPayslip.net_pay)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pay Date:</span>
                      <span className="font-medium">
                        {formatDate(showPayslip.pay_date)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Earnings and Deductions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3 bg-green-50">
                    <CardTitle className="text-sm flex items-center gap-2 text-green-800">
                      <TrendingUp className="w-4 h-4" />
                      EARNINGS
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3 text-sm">
                    <div>
                      <div className="flex justify-between">
                        <span>Basic Pay</span>
                        <span className="font-medium">
                          ₱{formatMoney(showPayslip.base_pay)}
                        </span>
                      </div>
                      <div className="flex justify-between mt-4">
                        <span>Night Differential</span>
                        <span className="font-medium">
                          ₱{formatMoney(showPayslip.night_diff_pay)}
                        </span>
                      </div>
                      <div className="flex justify-between mt-4">
                        <span>Overtime Pay</span>
                        <span className="font-medium">
                          ₱{formatMoney(showPayslip.overtime_pay)}
                        </span>
                      </div>
                      <div className="flex justify-between mt-4">
                        <span>Holiday Pay</span>
                        <span className="font-medium">
                          ₱{formatMoney(showPayslip.holiday_pay)}
                        </span>
                      </div>
                      <div className="flex justify-between mt-4">
                        <span>Paid Leave ({showPayslip.paid_leave_days} days)</span>
                        <span className="font-medium">
                          ₱{formatMoney(showPayslip.paid_leave_amount)}
                        </span>
                      </div>
                    </div>
                    {Array.isArray(showPayslip?.allowances) &&
                    showPayslip.allowances.length > 0 ? (
                      showPayslip.allowances.map(
                        (
                          allowance: {
                            allowance_type: string;
                            allowance_amount: string;
                          },
                          index: number,
                        ) => (
                          <div key={index} className="flex justify-between">
                            <span>{allowance.allowance_type}</span>
                            <span className="font-medium">
                              ₱{formatMoney(allowance.allowance_amount)}
                            </span>
                          </div>
                        ),
                      )
                    ) : (
                      <div className="flex justify-between">
                        <span>No Allowances</span>
                        <span className="font-medium">₱0.00</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between pt-2">
                      <span className="font-bold">TOTAL EARNINGS:</span>
                      <span className="font-bold text-green-600">
                        ₱{formatMoney(showPayslip.gross_pay)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3 bg-red-50">
                    <CardTitle className="text-sm flex items-center gap-2 text-red-800">
                      <Calculator className="w-4 h-4" />
                      DEDUCTIONS
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    {showPayslip.deductions?.map(
                      (deduction: any, index: number) => (
                        <div key={index} className="flex justify-between">
                          <span>{deduction.deduction_type}:</span>
                          <span className="font-medium">
                            ₱{formatMoney(deduction.deduction_amount)}
                          </span>
                        </div>
                      ),
                    )}
                    <Separator />
                    <div className="flex justify-between pt-2">
                      <span className="font-bold">TOTAL DEDUCTIONS:</span>
                      <span className="font-bold text-red-600">
                        ₱{formatMoney(showPayslip.total_deductions)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {showPayslip.paid_leaves.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      Paid Leave Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {showPayslip.paid_leaves.map(
                      (
                        leave: PayslipData["paid_leaves"][number],
                        index: number,
                      ) => (
                      <div
                        key={`${leave.leave_type}-${leave.start_date}-${index}`}
                        className="flex items-center justify-between gap-4 border-b last:border-0 pb-2 last:pb-0"
                      >
                        <div>
                          <p className="font-medium">{leave.leave_type}</p>
                          <p className="text-muted-foreground">
                            {leave.start_date} to {leave.end_date} ({leave.days} days)
                          </p>
                        </div>
                        <span className="font-medium">
                          ₱{formatMoney(leave.amount)}
                        </span>
                      </div>
                      ),
                    )}
                  </CardContent>
                </Card>
              )}

              {showPayslip.holidays.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      Holiday Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {showPayslip.holidays.map((holiday) => (
                      <div
                        key={holiday.holiday_id}
                        className="flex items-center justify-between gap-4 border-b last:border-0 pb-2 last:pb-0"
                      >
                        <div>
                          <p className="font-medium">
                            {holiday.title || "Holiday"}
                          </p>
                          <p className="text-muted-foreground">
                            {holiday.date}
                          </p>
                        </div>
                        <span className="text-amber-700">
                          {holiday.holiday_type || "Holiday"}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Net Pay */}
              <Card>
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">
                    NET PAYABLE AMOUNT
                  </h3>
                  <div className="text-3xl font-bold text-blue-600">
                    ₱{formatMoney(showPayslip.net_pay)}
                  </div>
                  <p className="text-sm text-blue-700 mt-2">
                    This amount will be deposited to your registered bank
                    account
                  </p>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPayslip(null)}>
                Close
              </Button>
              <Button onClick={handleDownloadPayslip}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
