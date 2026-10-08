import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { BASE_URL_API } from '@/utils/BASE_URL_API';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
    Calculator,
    FileText,
    Plus,
    Users,
    FileSpreadsheet,
    Gift,
    Calendar,
    Info
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
        const response = await fetch(`${BASE_URL_API}/payroll/employees`, {
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
    }
};

export function ChristmasBonus() {
    const [periods, setPeriods] = useState<ThirteenthMonthPeriod[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<ThirteenthMonthPeriod | null>(null);
    const [thirteenthMonthRecords, setThirteenthMonthRecords] = useState<ThirteenthMonthRecord[]>([]);
    const [showGenerateDialog, setShowGenerateDialog] = useState(false);
    const [loading, setLoading] = useState(true);
    const [recordsLoading, setRecordsLoading] = useState(false);
    const [processing, setProcessing] = useState(false);

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

    // Calculate summary from records for the selected period
    const calculateSummary = () => {
        const totalRecords = thirteenthMonthRecords.length;
        const totalPayout = thirteenthMonthRecords.reduce((sum, record) => {
            return sum + parseFloat(record.amount || '0');
        }, 0);

        return {
            total_records: totalRecords,
            active_employees: employees.length,
            total_payout: totalPayout
        };
    };

    const summary = calculateSummary();

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

                // Automatically select the most recent period
                if (periodsData.length > 0) {
                    const mostRecentPeriod = periodsData[0];
                    setSelectedPeriod(mostRecentPeriod);
                    await loadRecordsForPeriod(mostRecentPeriod.id);
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

    const handlePeriodSelect = async (period: ThirteenthMonthPeriod) => {
        setSelectedPeriod(period);
        setThirteenthMonthRecords([]);
        await loadRecordsForPeriod(period.id);
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
                throw new Error(response.message || 'Failed to create 13th month period');
            }
        } catch (error: any) {
            console.error('Error creating 13th month period:', error);
            toast.error(error.message || 'Failed to create 13th month period');
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600">Total Records</p>
                                <p className="text-2xl font-bold text-blue-900">{summary.total_records}</p>
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
                                <p className="text-sm font-medium text-green-600">Active Employees</p>
                                <p className="text-2xl font-bold text-green-900">{summary.active_employees}</p>
                            </div>
                            <div className="p-2 bg-green-600 rounded-lg">
                                <Users className="size-4 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-600">Total Payout</p>
                                <p className="text-2xl font-bold text-purple-900">
                                    ₱{summary.total_payout.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="p-2 bg-purple-600 rounded-lg">
                                <Gift className="size-4 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Period Selection Cards */}
            {periods.length > 0 && (
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
                                    className={`cursor-pointer transition-all hover:shadow-md ${selectedPeriod?.id === period.id
                                        ? 'border-2 border-primary bg-primary/5'
                                        : 'border'
                                        }`}
                                    onClick={() => handlePeriodSelect(period)}
                                >
                                    <CardContent className="p-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Badge variant={period.is_locked ? "destructive" : "outline"} className="text-xs">
                                                    {period.is_locked ? 'Locked' : 'Active'}
                                                </Badge>
                                                {selectedPeriod?.id === period.id && (
                                                    <Badge variant="secondary" className="bg-primary text-primary-foreground">
                                                        Selected
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-semibold text-sm">{period.period_name}</h4>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{formatPeriodRange(period)}</span>
                                                </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Created: {formatDate(period.created_at)}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 13th Month Records Table */}
            {selectedPeriod && (
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <CardTitle>13th Month Pay Records - {selectedPeriod.period_name}</CardTitle>
                                <CardDescription>
                                    Records for period: {formatPeriodRange(selectedPeriod)}
                                    {recordsLoading && <span className="ml-2 text-blue-600">(Loading...)</span>}
                                </CardDescription>
                            </div>
                            <Badge variant="outline" className="w-fit">
                                {pagination.total} records
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="min-w-[150px]">Employee ID</TableHead>
                                        <TableHead className="min-w-[200px]">Employee Name</TableHead>
                                        <TableHead className="min-w-[150px]">Department</TableHead>
                                        <TableHead className="min-w-[120px]">Position</TableHead>
                                        <TableHead className="min-w-[140px]">13th Month Pay</TableHead>
                                        <TableHead className="min-w-[140px]">Generated Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recordsLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8">
                                                <div className="flex items-center justify-center">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                                                    Loading records...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : thirteenthMonthRecords.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                <Gift className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                <p>No 13th month records found for this period</p>
                                                <p className="text-sm">No payroll records found for selected employees in this period</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        thirteenthMonthRecords.map((record) => {

                                            return (
                                                <TableRow key={record.id}>
                                                    <TableCell className="min-w-[150px] font-medium">
                                                        {record.employee_id || 'N/A'}
                                                    </TableCell>
                                                    <TableCell className="min-w-[200px] font-medium">
                                                        {record.employee_name}
                                                    </TableCell>
                                                    <TableCell className="min-w-[150px]">
                                                        {record?.department || 'N/A'}
                                                    </TableCell>
                                                    <TableCell className="min-w-[120px]">
                                                        {record?.position || 'N/A'}
                                                    </TableCell>
                                                    <TableCell className="min-w-[140px] font-semibold text-green-600">
                                                        ₱{parseFloat(record.amount || '0').toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                    </TableCell>
                                                    <TableCell className="min-w-[140px]">
                                                        {formatDate(record.created_at)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {pagination.last_page > 1 && (
                            <div className="flex justify-between items-center">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} records
                                </div>
                                <div className="flex gap-2">
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
                                        The system will calculate based on actual payroll records (gross_base) for each selected employee within the specified date range.
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
                                                const allEmployeeIds = employees.map(emp => emp.id);
                                                setSelectedEmployees(allEmployeeIds);
                                            }}
                                        >
                                            Select All
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
                                                    {employees.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                                <p>No employees found</p>
                                                                <p className="text-sm">Add employees to the system first</p>
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        employees.map((employee) => {
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
        </div>
    );
}

export default ChristmasBonus;