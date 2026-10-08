import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download, Eye, Filter, TrendingUp, Users, Clock, DollarSign, RefreshCw, Search } from 'lucide-react';
import { mockEmployees, mockDepartments, mockPayroll } from '../data/mockData';
import api from '@/utils/axios';

// Mock report data
const turnoverData = [
    { month: 'Jan', hired: 5, left: 2, rate: 8.5 },
    { month: 'Feb', hired: 3, left: 1, rate: 4.2 },
    { month: 'Mar', hired: 7, left: 3, rate: 12.8 },
    { month: 'Apr', hired: 4, left: 1, rate: 4.1 },
    { month: 'May', hired: 6, left: 2, rate: 8.3 },
    { month: 'Jun', hired: 2, left: 4, rate: 16.7 },
];

const payrollTrends = [
    { month: 'Jan', totalCost: 485000, avgSalary: 7800 },
    { month: 'Feb', totalCost: 492000, avgSalary: 7920 },
    { month: 'Mar', totalCost: 498000, avgSalary: 8030 },
    { month: 'Apr', totalCost: 501000, avgSalary: 8080 },
    { month: 'May', totalCost: 507000, avgSalary: 8180 },
    { month: 'Jun', totalCost: 512000, avgSalary: 8260 },
];

const complianceReports = [
    { type: 'Labor Law Compliance', status: 'Compliant', lastAudit: '2024-01-15', nextAudit: '2024-07-15' },
    { type: 'Tax Compliance', status: 'Compliant', lastAudit: '2024-01-01', nextAudit: '2024-04-01' },
    { type: 'Safety Regulations', status: 'Minor Issues', lastAudit: '2023-12-10', nextAudit: '2024-03-10' },
    { type: 'Benefits Compliance', status: 'Compliant', lastAudit: '2024-01-20', nextAudit: '2024-06-20' },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface EodReport {
    id: number;
    status: string;
    is_late: boolean | number;
    clock_in?: string | null;
    clock_out?: string | null;
    report_today?: string | null;
    hours_worked?: number | string | null;
    late_minutes?: number | string | null;
    late_deduction?: number | string | null;
    employee?: {
        first_name: string;
        middle_name?: string | null;
        last_name: string;
        employee_id: string;
    };
}

interface EodResponse {
    isSuccess: boolean;
    message?: string;
    summary?: {
        total_reports: number;
        total_present: number;
        total_late: number;
        total_on_time: number;
        total_hours_worked: number;
        total_late_minutes: number;
        total_late_deduction: number;
    };
    reports?: EodReport[];
    pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

const emptyEodSummary = {
    total_reports: 0,
    total_present: 0,
    total_late: 0,
    total_on_time: 0,
    total_hours_worked: 0,
    total_late_minutes: 0,
    total_late_deduction: 0,
};

const getToday = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatDateTime = (value?: string | null) => value ? new Date(value).toLocaleString() : '--';

const REPORT_PREVIEW_MAX_LENGTH = 120;

const plainTextReport = (value?: string | null) => {
    if (!value) return '--';

    const text = new DOMParser()
        .parseFromString(value, 'text/html')
        .body.textContent
        ?.replace(/\s+/g, ' ')
        .trim() || '--';

    return text.length > REPORT_PREVIEW_MAX_LENGTH
        ? `${text.slice(0, REPORT_PREVIEW_MAX_LENGTH).trimEnd()}...`
        : text;
};

const fullPlainTextReport = (value?: string | null) => {
    if (!value) return '--';

    const reportWithLineBreaks = value
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(?:p|div|li|h[1-6]|blockquote)>/gi, '\n');

    return new DOMParser()
        .parseFromString(reportWithLineBreaks, 'text/html')
        .body.textContent
        ?.replace(/[ \t]+/g, ' ')
        .replace(/[ \t]*\n[ \t]*/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim() || '--';
};

const employeeName = (employee?: EodReport['employee']) => employee
    ? [employee.first_name, employee.middle_name, employee.last_name].filter(Boolean).join(' ')
    : 'Unknown employee';

const ReportAnalytics = () => {
    const [selectedReport, setSelectedReport] = useState('overview');
    const [eodReports, setEodReports] = useState<EodReport[]>([]);
    const [eodSummary, setEodSummary] = useState(emptyEodSummary);
    const [eodLoading, setEodLoading] = useState(false);
    const [eodError, setEodError] = useState<string | null>(null);
    const [eodFilters, setEodFilters] = useState({ date: getToday(), search: '', status: '', is_late: '' });
    const [eodPage, setEodPage] = useState(1);
    const [eodPagination, setEodPagination] = useState({ current_page: 1, last_page: 1, per_page: 20, total: 0 });
    const [selectedEodReport, setSelectedEodReport] = useState<EodReport | null>(null);

    useEffect(() => {
        if (selectedReport !== 'attendance') return;

        const fetchEodReports = async () => {
            try {
                setEodLoading(true);
                setEodError(null);
                const params = {
                    date: eodFilters.date,
                    page: eodPage,
                    per_page: 20,
                    ...(eodFilters.search && { search: eodFilters.search }),
                    ...(eodFilters.status && { status: eodFilters.status }),
                    ...(eodFilters.is_late && { is_late: eodFilters.is_late }),
                };
                const response = await api.get<EodResponse>('/dashboard/eod-reports', { params });

                if (!response.data.isSuccess) throw new Error(response.data.message || 'Failed to load EOD reports.');
                setEodReports(response.data.reports || []);
                setEodSummary(response.data.summary || emptyEodSummary);
                setEodPagination(response.data.pagination || { current_page: 1, last_page: 1, per_page: 20, total: 0 });
            } catch (error) {
                setEodError(error instanceof Error ? error.message : 'Failed to load EOD reports.');
            } finally {
                setEodLoading(false);
            }
        };

        fetchEodReports();
    }, [selectedReport, eodFilters, eodPage]);

    const reportTypes = [
        { value: 'overview', label: 'Overview Dashboard' },
        { value: 'workforce', label: 'Workforce Analytics' },
        { value: 'attendance', label: 'Attendance Reports' },
        { value: 'payroll', label: 'Payroll Analysis' },
        { value: 'compliance', label: 'Compliance Reports' },
        { value: 'performance', label: 'Performance Metrics' },
    ];

    const exportReport = (format: string) => {
        try {
            const normalized = format.toLowerCase();
            // Live EOD view exports real rows; placeholder views export their demo rows and are labeled.
            const isLiveView = selectedReport === 'attendance' && eodReports.length > 0;
            const rows: Record<string, unknown>[] = isLiveView
                ? eodReports.map((r) => ({
                    id: r.id,
                    employee: employeeName(r.employee),
                    status: r.status,
                    clock_in: r.clock_in ?? '',
                    clock_out: r.clock_out ?? '',
                    hours_worked: r.hours_worked ?? '',
                }))
                : (selectedReport === 'overview' ? mockEmployees : selectedReport === 'payroll' ? mockPayroll : mockDepartments).map((r) => ({ ...(r as object) }));
            if (rows.length === 0) return;
            if (normalized === 'csv') {
                const headers = Object.keys(rows[0]);
                const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${selectedReport}-report${isLiveView ? '' : '-demo'}.csv`;
                a.click();
                URL.revokeObjectURL(url);
            } else {
                // CSV is the supported file export; other formats fall back to CSV with a demo label when applicable.
                exportReport('csv');
            }
        } catch {
            // no-op: export is best-effort
        }
    };

    const renderOverviewDashboard = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Badge variant="outline">Demo data — connect live HRIS source to replace mockEmployees/mockDepartments/mockPayroll</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mockEmployees.length}</div>
                        <p className="text-xs text-muted-foreground">+2 from last month</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">93.4%</div>
                        <p className="text-xs text-muted-foreground">+1.2% from last month</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$512K</div>
                        <p className="text-xs text-muted-foreground">+1.0% from last month</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Turnover Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">9.2%</div>
                        <p className="text-xs text-muted-foreground">-2.1% from last month</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Turnover Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={turnoverData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="rate" stroke="#8884d8" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Department Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={mockDepartments}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }) => `${name}: ${value}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="employeeCount"
                                >
                                    {mockDepartments.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    const renderAttendanceReports = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>End-of-Day Attendance Reports</CardTitle>
                    <CardDescription>Attendance records with a clock-out and submitted daily report</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <Input type="date" value={eodFilters.date} onChange={(event) => { setEodPage(1); setEodFilters({ ...eodFilters, date: event.target.value }); }} />
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input className="pl-9" placeholder="Search employee..." value={eodFilters.search} onChange={(event) => { setEodPage(1); setEodFilters({ ...eodFilters, search: event.target.value }); }} />
                        </div>
                        <Select value={eodFilters.status || 'all'} onValueChange={(value) => { setEodPage(1); setEodFilters({ ...eodFilters, status: value === 'all' ? '' : value }); }}>
                            <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                            <SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="Present">Present</SelectItem><SelectItem value="Absent">Absent</SelectItem></SelectContent>
                        </Select>
                        <Select value={eodFilters.is_late || 'all'} onValueChange={(value) => { setEodPage(1); setEodFilters({ ...eodFilters, is_late: value === 'all' ? '' : value }); }}>
                            <SelectTrigger><SelectValue placeholder="All attendance" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All attendance</SelectItem>
                                <SelectItem value="1">Late</SelectItem>
                                <SelectItem value="0">On time</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
                        {[
                            ['Reports', eodSummary.total_reports], ['Present', eodSummary.total_present], ['Late', eodSummary.total_late],
                            ['On time', eodSummary.total_on_time], ['Hours', eodSummary.total_hours_worked], ['Late mins', eodSummary.total_late_minutes], ['Deduction', eodSummary.total_late_deduction],
                        ].map(([label, value]) => <div key={label} className="rounded-md border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-semibold">{typeof value === 'number' ? value.toLocaleString() : value}</p></div>)}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    {eodLoading ? <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground"><RefreshCw className="h-5 w-5 animate-spin" />Loading EOD reports...</div> : eodError ? <div className="p-10 text-center text-red-500">{eodError}</div> : <>
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Status</TableHead><TableHead>Clock out</TableHead><TableHead>Hours</TableHead><TableHead>Late</TableHead><TableHead>Report</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>{eodReports.length === 0 ? <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">No EOD reports found.</TableCell></TableRow> : eodReports.map((report) => <TableRow key={report.id}>
                                    <TableCell><div className="font-medium">{employeeName(report.employee)}</div><div className="text-xs text-muted-foreground">{report.employee?.employee_id || '--'}</div></TableCell>
                                    <TableCell><Badge variant="outline">{report.status || '--'}</Badge></TableCell><TableCell>{formatDateTime(report.clock_out)}</TableCell><TableCell>{report.hours_worked ?? '--'}</TableCell><TableCell>{report.is_late ? `${report.late_minutes ?? 0} min` : 'On time'}</TableCell><TableCell className="max-w-sm whitespace-normal">{plainTextReport(report.report_today)}</TableCell>
                                    <TableCell className="text-right"><Button variant="outline" size="sm" className="border-border" onClick={() => setSelectedEodReport(report)}><Eye className="mr-2 h-4 w-4" />View details</Button></TableCell>
                                </TableRow>)}</TableBody>
                            </Table>
                        </div>
                        <div className="divide-y md:hidden">
                            {eodReports.length === 0 ? <div className="py-10 text-center text-muted-foreground">No EOD reports found.</div> : eodReports.map((report) => <div key={report.id} className="space-y-3 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div><div className="font-medium">{employeeName(report.employee)}</div><div className="text-xs text-muted-foreground">{report.employee?.employee_id || '--'}</div></div>
                                    <Badge variant="outline">{report.status || '--'}</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div><p className="text-xs text-muted-foreground">Clock out</p><p>{formatDateTime(report.clock_out)}</p></div>
                                    <div><p className="text-xs text-muted-foreground">Hours</p><p>{report.hours_worked ?? '--'}</p></div>
                                    <div><p className="text-xs text-muted-foreground">Attendance</p><p>{report.is_late ? `${report.late_minutes ?? 0} min late` : 'On time'}</p></div>
                                    <div><p className="text-xs text-muted-foreground">Report</p><p className="break-words">{plainTextReport(report.report_today)}</p></div>
                                </div>
                                <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedEodReport(report)}><Eye className="mr-2 h-4 w-4" />View details</Button>
                            </div>)}
                        </div>
                    </>}
                </CardContent>
                {!eodLoading && eodPagination.last_page > 1 && <CardContent className="flex items-center justify-between border-t py-3"><span className="text-sm text-muted-foreground">Page {eodPagination.current_page} of {eodPagination.last_page} ({eodPagination.total} total)</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={eodPage <= 1} onClick={() => setEodPage((page) => page - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={eodPage >= eodPagination.last_page} onClick={() => setEodPage((page) => page + 1)}>Next</Button></div></CardContent>}
            </Card>

            <Dialog open={selectedEodReport !== null} onOpenChange={(open) => !open && setSelectedEodReport(null)}>
                <DialogContent className="max-h-[calc(100vh-2rem)] overflow-hidden sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>EOD report details</DialogTitle>
                        <DialogDescription>{selectedEodReport ? employeeName(selectedEodReport.employee) : ''}</DialogDescription>
                    </DialogHeader>
                    {selectedEodReport && <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div><p className="text-xs text-muted-foreground">Employee ID</p><p className="font-medium">{selectedEodReport.employee?.employee_id || '--'}</p></div>
                            <div><p className="text-xs text-muted-foreground">Status</p><p className="font-medium">{selectedEodReport.status || '--'}</p></div>
                            <div><p className="text-xs text-muted-foreground">Clock in</p><p className="font-medium">{formatDateTime(selectedEodReport.clock_in)}</p></div>
                            <div><p className="text-xs text-muted-foreground">Clock out</p><p className="font-medium">{formatDateTime(selectedEodReport.clock_out)}</p></div>
                            <div><p className="text-xs text-muted-foreground">Hours worked</p><p className="font-medium">{selectedEodReport.hours_worked ?? '--'}</p></div>
                            <div><p className="text-xs text-muted-foreground">Late minutes</p><p className="font-medium">{selectedEodReport.late_minutes ?? 0}</p></div>
                            <div><p className="text-xs text-muted-foreground">Late deduction</p><p className="font-medium">{selectedEodReport.late_deduction ?? 0}</p></div>
                        </div>
                        <div>
                            <p className="mb-2 text-xs text-muted-foreground">Report</p>
                            <div className="max-h-[40vh] overflow-y-auto rounded-md border bg-muted/30 p-4 sm:max-h-72">
                                <p className="whitespace-pre-wrap text-sm">{fullPlainTextReport(selectedEodReport.report_today)}</p>
                            </div>
                        </div>
                    </div>}
                </DialogContent>
            </Dialog>
        </div>
    );

    const renderPayrollAnalysis = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Payroll Trends</CardTitle>
                    <CardDescription>Monthly payroll costs and average salary trends</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={payrollTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="totalCost" stroke="#8884d8" strokeWidth={2} name="Total Cost" />
                            <Line type="monotone" dataKey="avgSalary" stroke="#82ca9d" strokeWidth={2} name="Avg Salary" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Payroll Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Base Salary</TableHead>
                                <TableHead>Overtime</TableHead>
                                <TableHead>Bonuses</TableHead>
                                <TableHead>Deductions</TableHead>
                                <TableHead>Net Pay</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockPayroll.map((pay) => (
                                <TableRow key={pay.employeeId}>
                                    <TableCell>{pay.employeeName}</TableCell>
                                    <TableCell>${pay.baseSalary.toLocaleString()}</TableCell>
                                    <TableCell>${pay.overtime.toLocaleString()}</TableCell>
                                    <TableCell>${pay.bonuses.toLocaleString()}</TableCell>
                                    <TableCell>${pay.deductions.toLocaleString()}</TableCell>
                                    <TableCell className="font-medium">${pay.netPay.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );

    const renderComplianceReports = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Compliance Status</CardTitle>
                    <CardDescription>Current compliance status across all regulations</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Compliance Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Audit</TableHead>
                                <TableHead>Next Audit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {complianceReports.map((report, index) => (
                                <TableRow key={index}>
                                    <TableCell>{report.type}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={report.status === 'Compliant' ? 'default' : 'secondary'}
                                            className={report.status === 'Compliant' ? 'bg-green-500' : 'bg-yellow-500'}
                                        >
                                            {report.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{report.lastAudit}</TableCell>
                                    <TableCell>{report.nextAudit}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );

    const renderReportContent = () => {
        switch (selectedReport) {
            case 'overview':
                return renderOverviewDashboard();
            case 'attendance':
                return renderAttendanceReports();
            case 'payroll':
                return renderPayrollAnalysis();
            case 'compliance':
                return renderComplianceReports();
            default:
                return renderOverviewDashboard();
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Reports & Analytics</h1>
                    <p className="text-muted-foreground">
                        Comprehensive insights and compliance reporting
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => exportReport('pdf')}>
                        <Download className="w-4 h-4 mr-2" />
                        Export PDF
                    </Button>
                    <Button variant="outline" onClick={() => exportReport('excel')}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Excel
                    </Button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <Select value={selectedReport} onValueChange={setSelectedReport}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                            {reportTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button variant="outline" size="icon">
                    <Filter className="w-4 h-4" />
                </Button>
            </div>

            {renderReportContent()}
        </div>
    );
}

export default ReportAnalytics;