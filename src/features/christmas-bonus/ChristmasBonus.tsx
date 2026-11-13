import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { BASE_URL_API } from '@/utils/BASE_URL_API';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
    summarizePeriodCalculations,
    type EmployeeCalculationTotals,
    type PeriodCalculationSummary,
} from './periodCalculationSummary';
import {
    Calculator,
    FileText,
    Plus,
    Users,
    FileSpreadsheet,
    Gift,
    Calendar,
    Info,
    Eye,
    Search,
    CheckCircle2,
    ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

// Updated Types based on your new API
interface Employee {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    base_salary: number;
    position: string;
    department: string;
    employment_status: string;
    employee_id: string;
}

interface ThirteenthMonthPeriod {
    id: string;
    period_name: string;
    start_date: string;
    end_date: string;
    is_locked: boolean;
    is_draft: boolean | 0 | 1;
    created_at: string;
    updated_at: string;
}

interface ThirteenthMonthRecord {
    id: string;
    employee_id: string;
    period_id: string;
    employee_name: string;
    department: string;
    position: string;
    amount: string;
    remarks: string | null;
    created_at: string;
    updated_at: string;
    is_archived: boolean;

}

interface ThirteenthMonthCalculation {
    isSuccess: boolean;
    message?: string;
    error?: string;
    employee: {
        id: number;
        employee_id: string;
        employee_name: string;
        department: string | null;
        position: string | null;
    };
    thirteenth_month_period: {
        id: number;
        period_name: string;
        start_date: string;
        end_date: string;
    };
    calculation: {
        formula: string;
        total_payroll_periods: number;
        total_basic_salary: number;
        divisor: number;
        calculated_amount: number;
        saved_amount: number;
        difference: number;
        is_match: boolean;
    };
    payroll_breakdown: {
        payroll_record_id: number;
        payroll_period_id: number;
        period_name: string | null;
        cutoff_start_date: string | null;
        cutoff_end_date: string | null;
        pay_date: string | null;
        gross_base: number;
    }[];
    payslip: {
        id: number;
        amount: number;
        remarks: string | null;
        created_at: string;
    };
}

interface PaginationInfo {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

// Updated API Service Functions
const thirteenthMonthAPI = {
    // Create 13th month period and calculate pays
    async createThirteenthMonthPeriod(periodData: {
        period_name: string;
        start_date: string;
        end_date: string;
        employees: { employee_id: number }[];
    }) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL_API}/thirteenth-month/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(periodData),
        });
        return await response.json();
    },

    // Get employees
    async getEmployees() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL_API}/employees?page=1&per_page=100`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return await response.json();
    },

    // Get 13th month periods
    async getThirteenthMonthPeriods() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL_API}/thirteenth-month/periods`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return await response.json();
    },

    async processThirteenthMonthDraft(periodId: string) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL_API}/thirteenth-month/${encodeURIComponent(periodId)}/process`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return await response.json();
    },

    // Get 13th month records by period
    async getThirteenthMonthRecordsByPeriod(periodId: string, page: number = 1, perPage: number = 10) {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
            page: page.toString(),
            per_page: perPage.toString(),
        });

        const response = await fetch(`${BASE_URL_API}/thirteenth-month/pays/${periodId}?${params}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return await response.json();
    },

    async getThirteenthMonthCalculation(periodId: string, employeeId: string) {
        const token = localStorage.getItem('token');
        const response = await fetch(
            `${BASE_URL_API}/thirteenth-month/${encodeURIComponent(periodId)}/employee/${encodeURIComponent(employeeId)}/calculation`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        return await response.json() as ThirteenthMonthCalculation;
    }
};

export function ChristmasBonus() {
    const [periods, setPeriods] = useState<ThirteenthMonthPeriod[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<ThirteenthMonthPeriod | null>(null);
    const [showPeriodRecords, setShowPeriodRecords] = useState(false);
    const [periodToProcess, setPeriodToProcess] = useState<ThirteenthMonthPeriod | null>(null);
    const [processingPeriodId, setProcessingPeriodId] = useState<string | null>(null);
    const [thirteenthMonthRecords, setThirteenthMonthRecords] = useState<ThirteenthMonthRecord[]>([]);
    const [showGenerateDialog, setShowGenerateDialog] = useState(false);
    const [loading, setLoading] = useState(true);
    const [recordsLoading, setRecordsLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [calculationDialogOpen, setCalculationDialogOpen] = useState(false);
    const [calculationLoading, setCalculationLoading] = useState(false);
    const [calculationDetails, setCalculationDetails] = useState<ThirteenthMonthCalculation | null>(null);
    const [periodCalculationSummary, setPeriodCalculationSummary] = useState<{
        periodId: string;
        data: PeriodCalculationSummary;
    } | null>(null);
    const [summaryLoadingPeriod, setSummaryLoadingPeriod] = useState<string | null>(null);
    const [summaryError, setSummaryError] = useState<{ periodId: string; message: string } | null>(null);
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [recordsSearch, setRecordsSearch] = useState('');
    const [allRecordsByPeriod, setAllRecordsByPeriod] = useState<Record<string, ThirteenthMonthRecord[]>>({});
    const [searchLoadingPeriod, setSearchLoadingPeriod] = useState<string | null>(null);
    const searchLoads = useRef(new Set<string>());

    const [employees, setEmployees] = useState<Employee[]>([]);

    const [newThirteenthMonthPeriod, setNewThirteenthMonthPeriod] = useState({
        period_name: '',
        start_date: '',
        end_date: '',
    });
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

    const [pagination, setPagination] = useState<PaginationInfo>({
        total: 0,
        per_page: 10,
        current_page: 1,
        last_page: 1
    });

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Format period range
    const formatPeriodRange = (period: ThirteenthMonthPeriod) => {
        return `${formatDate(period.start_date)} - ${formatDate(period.end_date)}`;
    };

    // Auto-generate period name based on dates
    const generatePeriodName = (startDate: string, endDate: string) => {
        const startYear = new Date(startDate).getFullYear();
        const endYear = new Date(endDate).getFullYear();

        if (startYear === endYear) {
            return `13th Month - ${endYear}`;
        } else {
            return `13th Month - ${startYear}-${endYear}`;
        }
    };

    // Update period name when dates change
    useEffect(() => {
        if (newThirteenthMonthPeriod.start_date && newThirteenthMonthPeriod.end_date) {
            const periodName = generatePeriodName(
                newThirteenthMonthPeriod.start_date,
                newThirteenthMonthPeriod.end_date
            );
            setNewThirteenthMonthPeriod(prev => ({
                ...prev,
                period_name: periodName
            }));
        }
    }, [newThirteenthMonthPeriod.start_date, newThirteenthMonthPeriod.end_date]);

    const draftPeriods = periods.filter((period) => Boolean(period.is_draft)).length;
    const processedPeriods = periods.filter((period) => Boolean(period.is_locked)).length;
    const employeeSearchTerm = employeeSearch.trim().toLowerCase();
    const filteredEmployees = employees.filter((employee) =>
        [employee.full_name, employee.employee_id, employee.department, employee.position]
            .some((value) => value.toLowerCase().includes(employeeSearchTerm))
    );
    const recordsSearchTerm = recordsSearch.trim().toLowerCase();
    const recordsForSearch = recordsSearchTerm && selectedPeriod && allRecordsByPeriod[selectedPeriod.id]
        ? allRecordsByPeriod[selectedPeriod.id]
        : thirteenthMonthRecords;
    const selectedPeriodSummary = selectedPeriod && periodCalculationSummary?.periodId === selectedPeriod.id
        ? periodCalculationSummary.data
        : null;
    const selectedPeriodSummaryError = selectedPeriod && summaryError?.periodId === selectedPeriod.id
        ? summaryError.message
        : null;
    const isSummaryLoading = selectedPeriod !== null && summaryLoadingPeriod === selectedPeriod.id;
    const filteredRecords = recordsForSearch.filter((record) =>
        [record.employee_name, record.employee_id, record.department, record.position]
            .some((value) => value?.toLowerCase().includes(recordsSearchTerm))
    );

    // Load periods and employees on component mount
    useEffect(() => {
        loadPeriods();
    }, []);

    const loadPeriods = async () => {
        setLoading(true);
        try {
            const [employeesResponse, periodsResponse] = await Promise.all([
                thirteenthMonthAPI.getEmployees(),
                thirteenthMonthAPI.getThirteenthMonthPeriods()
            ]);

            if (employeesResponse.isSuccess) {
                const rawEmployees = employeesResponse.employees || [];
                const mappedEmployees: Employee[] = rawEmployees.map((emp: any) => {
                    const [firstName = '', ...rest] = (emp.full_name || '').split(' ');
                    const lastName = rest.join(' ');

                    return {
                        id: emp.id?.toString() || emp.employee_id?.toString() || '',
                        first_name: emp.first_name || firstName,
                        last_name: emp.last_name || lastName,
                        full_name: emp.full_name || `${emp.first_name || firstName} ${emp.last_name || lastName}`.trim(),
                        base_salary: typeof emp.base_salary === 'string'
                            ? parseFloat(emp.base_salary)
                            : (emp.base_salary || 0),
                        position: emp.position || 'N/A',
                        department: emp.department || 'N/A',
                        employment_status: 'active',
                        employee_id: emp.employee_id || emp.id?.toString() || '',
                    };
                });
                setEmployees(mappedEmployees);
            } else {
                console.error('Failed to load employees:', employeesResponse);
                toast.error(employeesResponse.message || 'Failed to load employees');
            }

            if (periodsResponse.isSuccess) {
                const periodsData = periodsResponse.data || [];
                setPeriods(periodsData);
                const currentPeriod = selectedPeriod
                    ? periodsData.find((period: ThirteenthMonthPeriod) => period.id === selectedPeriod.id)
                    : null;
                const periodToShow = currentPeriod || periodsData[0] || null;
                setSelectedPeriod(periodToShow);
                if (!selectedPeriod && periodToShow) {
                    await loadRecordsForPeriod(periodToShow.id);
                }
            } else {
                console.error('Failed to load periods:', periodsResponse);
                toast.error(periodsResponse.message || 'Failed to load periods');
            }

        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const loadRecordsForPeriod = async (periodId: string, page: number = 1) => {
        setRecordsLoading(true);
        try {
            const recordsResponse = await thirteenthMonthAPI.getThirteenthMonthRecordsByPeriod(periodId, page);

            if (recordsResponse.isSuccess) {
                setThirteenthMonthRecords(recordsResponse.data || []);
                setPagination(recordsResponse.pagination || {
                    total: 0,
                    per_page: 10,
                    current_page: 1,
                    last_page: 1
                });
            } else {
                console.error('Failed to load 13th month records:', recordsResponse);
                toast.error(recordsResponse.message || 'Failed to load 13th month records');
            }
        } catch (error) {
            console.error('Error loading records:', error);
            toast.error('Failed to load records');
        } finally {
            setRecordsLoading(false);
        }
    };

    const loadAllRecordsForSearch = async (periodId: string) => {
        const firstResponse = await thirteenthMonthAPI.getThirteenthMonthRecordsByPeriod(periodId, 1, 100);
        if (!firstResponse.isSuccess) {
            throw new Error(firstResponse.message || 'Failed to load 13th month records');
        }

        const records: ThirteenthMonthRecord[] = Array.isArray(firstResponse.data) ? firstResponse.data : [];
        const lastPage = Number(firstResponse.pagination?.last_page ?? 1);
        for (let page = 2; page <= lastPage; page++) {
            const response = await thirteenthMonthAPI.getThirteenthMonthRecordsByPeriod(periodId, page, 100);
            if (!response.isSuccess) {
                throw new Error(response.message || 'Failed to load 13th month records');
            }
            if (Array.isArray(response.data)) records.push(...response.data);
        }
        return records;
    };

    const loadPeriodCalculationSummary = async (periodId: string): Promise<PeriodCalculationSummary> => {
        const records = await loadAllRecordsForSearch(periodId);
        const calculationsForPeriod: EmployeeCalculationTotals[] = [];

        for (let index = 0; index < records.length; index += 10) {
            const batch = records.slice(index, index + 10);
            const calculations = await Promise.all(batch.map(async (record) => {
                const employee = employees.find((item) => item.employee_id === record.employee_id);
                if (!employee) {
                    throw new Error(`Could not resolve employee ${record.employee_id} for the period summary.`);
                }

                const response = await thirteenthMonthAPI.getThirteenthMonthCalculation(periodId, employee.id);
                if (!response.isSuccess) {
                    throw new Error(response.error || response.message || `Failed to calculate ${record.employee_name}.`);
                }
                return {
                    calculated_amount: response.calculation.calculated_amount,
                    total_payroll_periods: response.calculation.total_payroll_periods,
                };
            }));
            calculationsForPeriod.push(...calculations);
        }

        const totalEmployees = new Set(records.map((record) => record.employee_id)).size;
        return summarizePeriodCalculations(calculationsForPeriod, totalEmployees);
    };

    const handleRecordsSearch = (value: string) => {
        setRecordsSearch(value);
        if (!value.trim() || !selectedPeriod || allRecordsByPeriod[selectedPeriod.id] || searchLoads.current.has(selectedPeriod.id)) {
            return;
        }

        const periodId = selectedPeriod.id;
        searchLoads.current.add(periodId);
        setSearchLoadingPeriod(periodId);
        void loadAllRecordsForSearch(periodId)
            .then((records) => {
                setAllRecordsByPeriod((previous) => ({ ...previous, [periodId]: records }));
            })
            .catch((error) => {
                searchLoads.current.delete(periodId);
                console.error('Failed to load records for search:', error);
                toast.error(error instanceof Error ? error.message : 'Failed to load records for search');
            })
            .finally(() => {
                setSearchLoadingPeriod((current) => current === periodId ? null : current);
            });
    };

    const handleViewCalculation = async (record: ThirteenthMonthRecord) => {
        if (!selectedPeriod) return;

        const employee = employees.find((item) => item.employee_id === record.employee_id);
        if (!employee) {
            toast.error('Could not find the employee record. Refresh and try again.');
            return;
        }

        setCalculationDetails(null);
        setCalculationDialogOpen(true);
        setCalculationLoading(true);
        try {
            const response = await thirteenthMonthAPI.getThirteenthMonthCalculation(
                selectedPeriod.id,
                employee.id
            );
            if (!response.isSuccess) {
                throw new Error(response.error || response.message || 'Failed to load calculation details');
            }
            setCalculationDetails(response);
        } catch (error) {
            console.error('Failed to load 13th month calculation:', error);
            setCalculationDialogOpen(false);
            toast.error(error instanceof Error ? error.message : 'Failed to load calculation details');
        } finally {
            setCalculationLoading(false);
        }
    };

    const handlePeriodSelect = async (period: ThirteenthMonthPeriod) => {
        setSelectedPeriod(period);
        setShowPeriodRecords(true);
        setRecordsSearch('');
        setThirteenthMonthRecords([]);
        setSummaryError(null);
        if (periodCalculationSummary?.periodId !== period.id && summaryLoadingPeriod !== period.id) {
            setPeriodCalculationSummary(null);
            setSummaryLoadingPeriod(period.id);
            void loadPeriodCalculationSummary(period.id)
                .then((data) => setPeriodCalculationSummary({ periodId: period.id, data }))
                .catch((error) => {
                    const message = error instanceof Error ? error.message : 'Failed to load period calculation summary';
                    console.error('Failed to load period calculation summary:', error);
                    setSummaryError({ periodId: period.id, message });
                    toast.error(message);
                })
                .finally(() => {
                    setSummaryLoadingPeriod((current) => current === period.id ? null : current);
                });
        }
        await loadRecordsForPeriod(period.id);
    };

    const handleBackToPeriods = () => {
        setShowPeriodRecords(false);
        setRecordsSearch('');
    };

    const handleProcessDraft = async () => {
        if (!periodToProcess) return;

        setProcessingPeriodId(periodToProcess.id);
        try {
            const response = await thirteenthMonthAPI.processThirteenthMonthDraft(periodToProcess.id);
            if (!response.isSuccess) {
                throw new Error(response.error || response.message || 'Failed to process 13th month period');
            }
            toast.success(response.message || '13th month period processed and locked.');
            setPeriodToProcess(null);
            await loadPeriods();
        } catch (error) {
            console.error('Failed to process 13th month period:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to process 13th month period');
        } finally {
            setProcessingPeriodId(null);
        }
    };

    const handleExportToExcel = async () => {
        if (!selectedPeriod) {
            toast.error('No period selected for export.');
            return;
        }

        setLoading(true);
        try {
            // Fetch all pages so the file and totals do not vary with pagination.
            let allRecords = [...thirteenthMonthRecords];
            const lastPage = pagination?.last_page ?? 1;
            const currentPage = pagination?.current_page ?? 1;
            if (lastPage > 1) {
                for (let page = 1; page <= lastPage; page++) {
                    if (page === currentPage) continue;
                    const res = await thirteenthMonthAPI.getThirteenthMonthRecordsByPeriod(selectedPeriod.id, page);
                    if (res.isSuccess && Array.isArray(res.data)) allRecords = allRecords.concat(res.data);
                }
            }
            if (allRecords.length === 0) {
                toast.error('No 13th month records to export.');
                return;
            }
            const dataToExport = allRecords.map((record) => ({
                'Employee ID': record.employee_id || 'N/A',
                'Employee Name': record.employee_name || 'N/A',
                'Calculation Period': selectedPeriod ? formatPeriodRange(selectedPeriod) : 'N/A',
                '13th Month Pay': parseFloat(record.amount || '0'),
                'Generated Date': formatDate(record.created_at),
            }));

            const ws = XLSX.utils.json_to_sheet(dataToExport);

            ws['!cols'] = [
                { wch: 15 },
                { wch: 25 },
                { wch: 30 },
                { wch: 20 },
                { wch: 20 },
            ];

            const wb = XLSX.utils.book_new();

            const periodName = selectedPeriod
                ? `${formatDate(selectedPeriod.start_date)}_to_${formatDate(selectedPeriod.end_date)}`
                : 'All_Periods';

            const sheetName = `13th Month - ${periodName}`;

            // ✅ FIX: Excel sheet name limit & invalid chars
            const safeSheetName = sheetName
                .replace(/[/\\?*[\]]/g, "")
                .substring(0, 31);

            XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const excelData = new Blob([excelBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });

            const fileName = `13th_Month_${periodName}.xlsx`;
            saveAs(excelData, fileName);

            toast.success('13th month data exported to Excel successfully!');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export 13th month data to Excel.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleEmployee = (employeeId: string) => {
        if (selectedEmployees.includes(employeeId)) {
            setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId));
        } else {
            setSelectedEmployees([...selectedEmployees, employeeId]);
        }
    };

    const handleCreateThirteenthMonthPeriod = async () => {
        if (selectedEmployees.length === 0) {
            toast.error('Please select at least one employee');
            return;
        }

        if (!newThirteenthMonthPeriod.start_date || !newThirteenthMonthPeriod.end_date) {
            toast.error('Please fill in the date range');
            return;
        }

        if (!newThirteenthMonthPeriod.period_name) {
            toast.error('Please provide a period name');
            return;
        }

        setProcessing(true);
        try {
            const periodData = {
                period_name: newThirteenthMonthPeriod.period_name,
                start_date: newThirteenthMonthPeriod.start_date,
                end_date: newThirteenthMonthPeriod.end_date,
                employees: selectedEmployees.map(empId => ({
                    employee_id: parseInt(empId)
                }))
            };

            console.log('Creating 13th month period with data:', periodData);

            const response = await thirteenthMonthAPI.createThirteenthMonthPeriod(periodData);

            if (response.isSuccess) {
                toast.success('13th month period created and pays calculated successfully!');
                setShowGenerateDialog(false);

                // Reset form
                setSelectedEmployees([]);
                setNewThirteenthMonthPeriod({
                    period_name: '',
                    start_date: '',
                    end_date: '',
                });

                // Reload periods to see the new one
                await loadPeriods();
            } else {
                throw new Error(response.error || response.message || 'Failed to create 13th month period');
            }
        } catch (error) {
            console.error('Error creating 13th month period:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to create 13th month period');
        } finally {
            setProcessing(false);
        }
    };

    if (loading && periods.length === 0) {
        return (
            <div className="p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading 13th month data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">13th Month Pay</h1>
                    <p className="text-muted-foreground">Calculate and process annual 13th month bonuses</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleExportToExcel}
                        className="gap-2"
                        disabled={thirteenthMonthRecords.length === 0 || !selectedPeriod}
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        Export Excel
                    </Button>
                    <Button onClick={() => setShowGenerateDialog(true)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Create 13th Month Period
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            {!showPeriodRecords && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-600">Total Periods</p>
                                    <p className="text-2xl font-bold text-blue-900">{periods.length}</p>
                                </div>
                                <div className="p-2 bg-blue-600 rounded-lg">
                                    <FileText className="size-4 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-amber-600">Draft</p>
                                    <p className="text-2xl font-bold text-amber-900">{draftPeriods}</p>
                                </div>
                                <div className="p-2 bg-amber-600 rounded-lg">
                                    <Calendar className="size-4 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-green-600">Processed</p>
                                    <p className="text-2xl font-bold text-green-900">{processedPeriods}</p>
                                </div>
                                <div className="p-2 bg-green-600 rounded-lg">
                                    <CheckCircle2 className="size-4 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {showPeriodRecords && selectedPeriod && (
                <section className="space-y-4" aria-labelledby="period-calculation-summary">
                    <div>
                        <h2 id="period-calculation-summary" className="text-lg font-semibold">Calculation Summary</h2>
                        <p className="text-sm text-muted-foreground">
                            {selectedPeriod.period_name} · aggregated across employee records
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Total Employees</p>
                                <p className="text-lg font-semibold">
                                    {selectedPeriodSummary
                                        ? selectedPeriodSummary.total_employees
                                        : selectedPeriodSummaryError ? 'Unavailable' : isSummaryLoading ? 'Calculating...' : '—'}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Calculated Amount</p>
                                <p className="text-lg font-semibold text-green-600">
                                    {selectedPeriodSummary
                                        ? `₱${selectedPeriodSummary.calculated_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                                        : selectedPeriodSummaryError ? 'Unavailable' : isSummaryLoading ? 'Calculating...' : '—'}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Payroll Records</p>
                                <p className="text-lg font-semibold">
                                    {selectedPeriodSummary
                                        ? selectedPeriodSummary.payroll_records
                                        : selectedPeriodSummaryError ? 'Unavailable' : isSummaryLoading ? 'Calculating...' : '—'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                    {selectedPeriodSummaryError && (
                        <p role="alert" className="text-sm text-destructive">{selectedPeriodSummaryError}</p>
                    )}
                </section>
            )}

            {/* Period Selection Cards */}
            {!showPeriodRecords && periods.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>13th Month Periods</CardTitle>
                        <CardDescription>Select a period to view its 13th month records</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {periods.map((period) => (
                                <Card
                                    key={period.id}
                                    className={`transition-shadow hover:shadow-md ${
                                        period.is_draft
                                            ? 'border-amber-200 bg-amber-50/50'
                                            : period.is_locked
                                                ? 'border-green-200 bg-green-50/50'
                                                : 'border-blue-200 bg-blue-50/50'
                                    } ${selectedPeriod?.id === period.id ? 'ring-2 ring-primary' : ''}`}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="space-y-1">
                                                <CardTitle className="text-base">{period.period_name}</CardTitle>
                                                <CardDescription className="text-xs">13th month period</CardDescription>
                                            </div>
                                            <Badge variant={period.is_locked ? "default" : period.is_draft ? "secondary" : "outline"}>
                                                {period.is_locked ? 'Processed' : period.is_draft ? 'Draft' : 'Active'}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <div className="flex flex-col justify-between h-full">
                                        <CardContent className="pb-3">
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between gap-3">
                                                    <span className="text-muted-foreground">Period:</span>
                                                    <span className="text-right">{formatPeriodRange(period)}</span>
                                                </div>
                                                <div className="flex justify-between gap-3">
                                                    <span className="text-muted-foreground">Created:</span>
                                                    <span className="text-right font-medium">{formatDate(period.created_at)}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardContent className="pt-0">
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 gap-1"
                                                    onClick={() => handlePeriodSelect(period)}
                                                >
                                                    <FileText className="w-3 h-3" />
                                                    View
                                                </Button>
                                                {Boolean(period.is_draft) && !period.is_locked && (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="flex-1 gap-1"
                                                        disabled={processingPeriodId !== null}
                                                        onClick={() => setPeriodToProcess(period)}
                                                    >
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Process
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 13th Month Records Table */}
            {showPeriodRecords && selectedPeriod && (
                <Card>
                    <CardContent className="p-0">
                        <div className="border rounded-lg">
                            <div className="p-4 bg-muted/50 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        13th Month Pay Records ({recordsSearchTerm ? filteredRecords.length : pagination.total} employees)
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedPeriod.period_name}: {formatPeriodRange(selectedPeriod)}
                                        {(recordsLoading || searchLoadingPeriod === selectedPeriod.id) && (
                                            <span className="ml-2 text-blue-600">
                                                {recordsLoading ? '(Loading...)' : '(Loading search...)'}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline" onClick={handleBackToPeriods}>
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Back to list
                                        </Button>
                                        {Boolean(selectedPeriod.is_draft) && !selectedPeriod.is_locked && (
                                            <Button
                                                type="button"
                                                onClick={() => setPeriodToProcess(selectedPeriod)}
                                                disabled={processingPeriodId !== null}
                                            >
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                Process
                                            </Button>
                                        )}
                                    </div>
                                    <div className="relative w-full sm:w-72">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                                        <Input
                                            aria-label="Search 13th month records"
                                            placeholder="Search employees..."
                                            value={recordsSearch}
                                            onChange={(event) => handleRecordsSearch(event.target.value)}
                                            className="pl-9 bg-background"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="min-w-[200px]">Employee</TableHead>
                                            <TableHead className="min-w-[150px]">Department</TableHead>
                                            <TableHead className="min-w-[120px]">Position</TableHead>
                                            <TableHead className="min-w-[140px]">13th Month Pay</TableHead>
                                            <TableHead className="min-w-[140px]">Generated Date</TableHead>
                                            <TableHead className="min-w-[100px]">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recordsLoading || searchLoadingPeriod === selectedPeriod.id ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8">
                                                    <div className="flex items-center justify-center">
                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                                                        {searchLoadingPeriod === selectedPeriod.id ? 'Loading records for search...' : 'Loading records...'}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredRecords.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                    <Gift className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                    <p>{recordsSearchTerm ? 'No records match your search' : 'No 13th month records found for this period'}</p>
                                                    {!recordsSearchTerm && <p className="text-sm">No payroll records found for selected employees in this period</p>}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredRecords.map((record) => (
                                                <TableRow key={record.id} className="hover:bg-muted/50">
                                                    <TableCell className="min-w-[200px] font-medium">
                                                        <div className="flex flex-col">
                                                            <span>{record.employee_name}</span>
                                                            <span className="text-xs text-muted-foreground">ID: {record.employee_id || 'N/A'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="min-w-[150px]">{record.department || 'N/A'}</TableCell>
                                                    <TableCell className="min-w-[120px]">{record.position || 'N/A'}</TableCell>
                                                    <TableCell className="min-w-[140px] font-semibold">
                                                        ₱{parseFloat(record.amount || '0').toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                    </TableCell>
                                                    <TableCell className="min-w-[140px]">{formatDate(record.created_at)}</TableCell>
                                                    <TableCell className="min-w-[100px]">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            aria-label={`View calculation for ${record.employee_name}`}
                                                            title="View calculation"
                                                            onClick={() => handleViewCalculation(record)}
                                                            disabled={calculationLoading}
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

                        {/* Pagination */}
                        {!recordsSearchTerm && pagination.last_page > 1 && (
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} employees
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pagination.current_page === 1 || recordsLoading}
                                        onClick={() => selectedPeriod && loadRecordsForPeriod(selectedPeriod.id, pagination.current_page - 1)}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pagination.current_page === pagination.last_page || recordsLoading}
                                        onClick={() => selectedPeriod && loadRecordsForPeriod(selectedPeriod.id, pagination.current_page + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* No Periods Message */}
            {periods.length === 0 && !loading && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No 13th Month Periods</h3>
                        <p className="text-muted-foreground mb-4">
                            You haven't created any 13th month periods yet. Create your first period to get started.
                        </p>
                        <Button onClick={() => setShowGenerateDialog(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Period
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Create 13th Month Period Dialog */}
            <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
                <DialogContent className="md:min-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Calculator className="w-5 h-5" />
                            Create 13th Month Period
                        </DialogTitle>
                        <DialogDescription>
                            Create a new 13th month period and calculate pays based on payroll records
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
                                        <Label htmlFor="start-date">Start Date *</Label>
                                        <Input
                                            type="date"
                                            id="start-date"
                                            value={newThirteenthMonthPeriod.start_date}
                                            onChange={(e) => setNewThirteenthMonthPeriod(prev => ({ ...prev, start_date: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="end-date">End Date *</Label>
                                        <Input
                                            type="date"
                                            id="end-date"
                                            value={newThirteenthMonthPeriod.end_date}
                                            onChange={(e) => setNewThirteenthMonthPeriod(prev => ({ ...prev, end_date: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="period-name">Period Name *</Label>
                                    <Input
                                        id="period-name"
                                        placeholder="13th Month - 2025"
                                        value={newThirteenthMonthPeriod.period_name}
                                        onChange={(e) => setNewThirteenthMonthPeriod(prev => ({ ...prev, period_name: e.target.value }))}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Period name will be auto-generated based on dates, but you can customize it
                                    </p>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-blue-800">
                                        <Info className="w-4 h-4" />
                                        <span className="text-sm font-medium">Calculation Method</span>
                                    </div>
                                    <p className="text-sm text-blue-700 mt-1">
                                        13th month pay = (Total basic salary from payroll records during period) ÷ 12
                                    </p>
                                    <p className="text-xs text-blue-600 mt-2">
                                        The system uses gross_base from processed, non-archived payroll records within the specified date range.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Employee Selection */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base">Select Employees</CardTitle>
                                        <CardDescription>
                                            Select employees to include in 13th month calculation
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedEmployees((previous) => Array.from(new Set([
                                                    ...previous,
                                                    ...filteredEmployees.map((employee) => employee.id)
                                                ])));
                                            }}
                                        >
                                            {employeeSearchTerm ? 'Select Matching' : 'Select All'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedEmployees([]);
                                            }}
                                        >
                                            Clear All
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                                    <Input
                                        aria-label="Search employees"
                                        placeholder="Search name, employee ID, department, or position"
                                        value={employeeSearch}
                                        onChange={(event) => setEmployeeSearch(event.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="max-h-96 overflow-y-auto">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader className="bg-muted/50">
                                                    <TableRow>
                                                        <TableHead className="w-12 sticky left-0 bg-muted/50 z-10">Select</TableHead>
                                                        <TableHead className="min-w-[200px] sticky left-12 bg-muted/50 z-10">Employee</TableHead>
                                                        <TableHead className="min-w-[120px]">Department</TableHead>
                                                        <TableHead className="min-w-[100px]">Position</TableHead>
                                                        <TableHead className="min-w-[100px]">Employee ID</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredEmployees.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                                <p>{employeeSearchTerm ? 'No employees match your search' : 'No employees found'}</p>
                                                                {!employeeSearchTerm && <p className="text-sm">Add employees to the system first</p>}
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        filteredEmployees.map((employee) => {
                                                            const isSelected = selectedEmployees.includes(employee.id);

                                                            return (
                                                                <TableRow
                                                                    key={employee.id}
                                                                    className={isSelected ? "bg-blue-50" : "bg-muted/30"}
                                                                >
                                                                    <TableCell className="sticky left-0 bg-inherit z-10">
                                                                        <Checkbox
                                                                            checked={isSelected}
                                                                            onCheckedChange={() => handleToggleEmployee(employee.id)}
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell className="sticky left-12 bg-inherit z-10 min-w-[200px]">
                                                                        <div className="flex items-center space-x-3">
                                                                            <Avatar className="h-8 w-8">
                                                                                <AvatarFallback className={`${isSelected ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                                                                                    {employee.first_name?.[0]}{employee.last_name?.[0]}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                            <div>
                                                                                <div className="font-medium">
                                                                                    {employee.full_name}
                                                                                </div>
                                                                                <div className="text-sm text-muted-foreground">
                                                                                    {employee.position || 'N/A'}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="min-w-[120px]">
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {employee.department || 'N/A'}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="min-w-[100px]">
                                                                        {employee.position || 'N/A'}
                                                                    </TableCell>
                                                                    <TableCell className="min-w-[100px] font-medium">
                                                                        {employee.employee_id}
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
                                                    <strong>{selectedEmployees.length}</strong> of <strong>{employees.length}</strong> employee(s) selected
                                                </p>
                                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                                    {Math.round((selectedEmployees.length / employees.length) * 100)}% Selected
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateThirteenthMonthPeriod}
                            disabled={selectedEmployees.length === 0 || processing || !newThirteenthMonthPeriod.period_name}
                        >
                            <Calculator className="w-4 h-4 mr-2" />
                            {processing ? 'Creating Period...' : 'Create Period & Calculate Pays'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={calculationDialogOpen} onOpenChange={setCalculationDialogOpen}>
                <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-4xl max-h-[calc(100dvh-2rem)] overflow-x-hidden overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>13th Month Calculation Details</DialogTitle>
                        <DialogDescription>
                            {calculationDetails
                                ? `${calculationDetails.employee.employee_name} · ${calculationDetails.thirteenth_month_period.period_name}`
                                : 'Loading payroll calculation...'}
                        </DialogDescription>
                    </DialogHeader>

                    {calculationLoading ? (
                        <div className="flex items-center justify-center gap-3 py-12" role="status">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                            Loading calculation...
                        </div>
                    ) : calculationDetails && (
                        <div className="space-y-5">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-lg border p-4">
                                    <p className="text-sm text-muted-foreground">Employee</p>
                                    <p className="font-medium">{calculationDetails.employee.employee_name}</p>
                                    <p className="text-sm text-muted-foreground">{calculationDetails.employee.employee_id}</p>
                                </div>
                                <div className="rounded-lg border p-4">
                                    <p className="text-sm text-muted-foreground">Period</p>
                                    <p className="font-medium">{calculationDetails.thirteenth_month_period.period_name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatDate(calculationDetails.thirteenth_month_period.start_date)} - {formatDate(calculationDetails.thirteenth_month_period.end_date)}
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="rounded-lg border p-4">
                                    <p className="text-sm text-muted-foreground">Total Basic Salary</p>
                                    <p className="text-lg font-semibold">
                                        ₱{calculationDetails.calculation.total_basic_salary.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="rounded-lg border p-4">
                                    <p className="text-sm text-muted-foreground">Formula</p>
                                    <p className="text-lg font-semibold">{calculationDetails.calculation.formula}</p>
                                </div>
                                <div className="rounded-lg border p-4">
                                    <p className="text-sm text-muted-foreground">Calculated Amount</p>
                                    <p className="text-lg font-semibold text-green-600">
                                        ₱{calculationDetails.calculation.calculated_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="rounded-lg border p-4">
                                    <p className="text-sm text-muted-foreground">Saved Amount</p>
                                    <p className="text-lg font-semibold">
                                        ₱{calculationDetails.calculation.saved_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Payroll records: {calculationDetails.calculation.total_payroll_periods}</p>
                                    <p className="text-sm text-muted-foreground">Divisor: {calculationDetails.calculation.divisor}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium">
                                        Difference: {calculationDetails.calculation.difference < 0 ? '-₱' : '₱'}
                                        {Math.abs(calculationDetails.calculation.difference).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                    </span>
                                    <Badge variant={calculationDetails.calculation.is_match ? 'default' : 'destructive'}>
                                        {calculationDetails.calculation.is_match ? 'Matches' : 'Mismatch'}
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-semibold">Payroll Breakdown</h3>
                                <div className="overflow-x-auto rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Payroll Period</TableHead>
                                                <TableHead>Cutoff</TableHead>
                                                <TableHead>Pay Date</TableHead>
                                                <TableHead className="text-right">Gross Base</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {calculationDetails.payroll_breakdown.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                                                        No payroll records found.
                                                    </TableCell>
                                                </TableRow>
                                            ) : calculationDetails.payroll_breakdown.map((payrollRecord) => (
                                                <TableRow key={payrollRecord.payroll_record_id}>
                                                    <TableCell>{payrollRecord.period_name || 'N/A'}</TableCell>
                                                    <TableCell>
                                                        {payrollRecord.cutoff_start_date ? formatDate(payrollRecord.cutoff_start_date) : 'N/A'}
                                                        {' - '}
                                                        {payrollRecord.cutoff_end_date ? formatDate(payrollRecord.cutoff_end_date) : 'N/A'}
                                                    </TableCell>
                                                    <TableCell>{payrollRecord.pay_date ? formatDate(payrollRecord.pay_date) : 'N/A'}</TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        ₱{payrollRecord.gross_base.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCalculationDialogOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={periodToProcess !== null}
                onOpenChange={(open) => {
                    if (!open && processingPeriodId === null) setPeriodToProcess(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Process 13th month period?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Processing {periodToProcess?.period_name} will lock the period and prevent further changes.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={processingPeriodId !== null}>
                            Cancel
                        </AlertDialogCancel>
                        <Button
                            type="button"
                            onClick={handleProcessDraft}
                            disabled={processingPeriodId !== null}
                        >
                            {processingPeriodId !== null ? 'Processing...' : 'Process and Lock'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export default ChristmasBonus;