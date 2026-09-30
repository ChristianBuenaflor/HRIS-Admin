import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Eye, RefreshCw, ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import { format, } from 'date-fns';

const API_BASE_URL = 'https://api-hris.slarenasitsolutions.com/public/api';

// Define types based on your backend response
interface Employee {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    department_id: number;
    position_id: number;
}

interface LeaveType {
    id: number;
    leave_name: string;
    description: string;
    max_days: number;
    is_paid: boolean;
    is_active: boolean;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
}

interface LeaveRequest {
    id: number;
    employee_id: number;
    leave_type_id: number;
    start_date: string;
    end_date: string;
    total_days: number;
    reason: string;
    status: string;
    is_archived: number;
    created_at: string;
    updated_at: string;
    employee: Employee;
    leave_type: LeaveType;
}

interface LeaveResponse {
    isSuccess: boolean;
    data: LeaveRequest[];
}

// Types for GET leaves/employee/ (getAllEmployeeLeaveBalances)
interface LeaveBalance {
    employee_leave_type_id: number;
    leave_type_id: number;
    leave_name: string | null;
    allocated_days: number;
    used_days: number;
    remaining_days: number;
    is_paid: boolean;
}

interface LeaveBalanceSummary {
    total_leave_types: number;
    total_allocated_days: number;
    total_used_days: number;
    total_remaining_days: number;
}

interface EmployeeLeaveBalance {
    id: number;
    employee_id: string;
    first_name: string;
    last_name: string;
    leave_balances: LeaveBalance[];
    summary: LeaveBalanceSummary;
}

interface LeaveBalancePagination {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}

interface LeaveBalanceResponse {
    isSuccess: boolean;
    message: string;
    data: EmployeeLeaveBalance[];
    pagination: LeaveBalancePagination;
}

const LeaveManagement = () => {
    const [activeTab, setActiveTab] = useState('requests');
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    // Employee leave balances state (GET leaves/employee/)
    const [leaveBalances, setLeaveBalances] = useState<EmployeeLeaveBalance[]>([]);
    const [selectedBalance, setSelectedBalance] = useState<EmployeeLeaveBalance | null>(null);
    const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false);
    const [balancesLoading, setBalancesLoading] = useState(false);
    const [balancesError, setBalancesError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [pagination, setPagination] = useState<LeaveBalancePagination>({
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1,
    });

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
    };

    // Fetch leave data from API
    const fetchLeaveRequests = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/leaves`, {
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: LeaveResponse = await response.json();

            if (data.isSuccess) {
                setLeaveRequests(data.data);
            } else {
                setError('Failed to fetch leave requests');
            }
        } catch (err) {
            console.error('Error fetching leave requests:', err);
            setError('Failed to fetch leave requests');
        } finally {
            setLoading(false);
        }
    };

    // Fetch employee leave balances from GET leaves/employee/
    const fetchLeaveBalances = async (page: number = currentPage, limit: number = perPage) => {
        setBalancesLoading(true);
        setBalancesError(null);
        try {
            const response = await fetch(
                `${API_BASE_URL}/leaves/employee?page=${page}&per_page=${limit}`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: LeaveBalanceResponse = await response.json();

            if (data.isSuccess) {
                setLeaveBalances(data.data);
                setPagination(data.pagination);
                setCurrentPage(data.pagination.current_page);
            } else {
                setBalancesError('Failed to fetch employee leave balances');
            }
        } catch (err) {
            console.error('Error fetching employee leave balances:', err);
            setBalancesError('Failed to fetch employee leave balances');
        } finally {
            setBalancesLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaveRequests();
    }, []);

    useEffect(() => {
        if (activeTab === 'balances') {
            fetchLeaveBalances(currentPage, perPage);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const handlePageChange = (page: number) => {
        if (page < 1 || page > pagination.last_page || page === currentPage) return;
        setCurrentPage(page);
        fetchLeaveBalances(page, perPage);
    };

    const handlePerPageChange = (value: string) => {
        const limit = parseInt(value, 10);
        setPerPage(limit);
        setCurrentPage(1);
        fetchLeaveBalances(1, limit);
    };

    const handleConfirmLeave = async (id: number, status: 'Approved' | 'Rejected') => {
        setActionLoading(id);
        try {
            const response = await fetch(`${API_BASE_URL}/confirm-leave/${id}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.isSuccess) {
                // Update the local state with the updated leave request
                setLeaveRequests(prev =>
                    prev.map(request =>
                        request.id === id ? { ...request, status: status } : request
                    )
                );

                // Show success message (you can replace this with a toast notification)
                alert(`Leave request ${status.toLowerCase()} successfully.`);
            } else {
                throw new Error(result.message || 'Failed to update leave request');
            }
        } catch (err) {
            console.error(`Error ${status.toLowerCase()}ing leave:`, err);
            alert(`Failed to ${status.toLowerCase()} leave request. Please try again.`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleApprove = async (id: number) => {
        await handleConfirmLeave(id, 'Approved');
    };

    const handleReject = async (id: number) => {
        await handleConfirmLeave(id, 'Rejected');
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved':
                return 'default';
            case 'pending':
                return 'secondary';
            case 'rejected':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const getLeaveTypeColor = (type: string) => {
        switch ((type || '').toLowerCase()) {
            case 'vacation':
                return 'bg-blue-100 text-blue-800';
            case 'sick leave':
                return 'bg-red-100 text-red-800';
            case 'personal':
                return 'bg-green-100 text-green-800';
            case 'maternity':
                return 'bg-purple-100 text-purple-800';
            case 'paternity':
                return 'bg-indigo-100 text-indigo-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getInitials = (firstName: string, lastName: string) => {
        return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
    };

    const getEmployeeName = (employee: Employee | EmployeeLeaveBalance) => {
        return `${employee.first_name} ${employee.last_name}`;
    };

    const getBalanceUsagePercent = (balance: LeaveBalance) => {
        if (!balance.allocated_days || balance.allocated_days <= 0) return 0;
        return Math.min(100, Math.round((balance.used_days / balance.allocated_days) * 100));
    };


    const pendingRequests = leaveRequests.filter(r => r.status.toLowerCase() === 'pending').length;
    const approvedRequests = leaveRequests.filter(r => r.status.toLowerCase() === 'approved').length;
    const rejectedRequests = leaveRequests.filter(r => r.status.toLowerCase() === 'rejected').length;

    // Aggregates for the balances tab (current page)
    const totalEmployees = pagination.total;
    const pageAllocated = leaveBalances.reduce((sum, e) => sum + (e.summary?.total_allocated_days ?? 0), 0);
    const pageUsed = leaveBalances.reduce((sum, e) => sum + (e.summary?.total_used_days ?? 0), 0);
    const pageRemaining = leaveBalances.reduce((sum, e) => sum + (e.summary?.total_remaining_days ?? 0), 0);

    const paginationFrom = pagination.total === 0 ? 0 : (pagination.current_page - 1) * pagination.per_page + 1;
    const paginationTo = Math.min(pagination.current_page * pagination.per_page, pagination.total);

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center">
                <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
        );
    }

    if (error && activeTab === 'requests') {
        return (
            <div className="p-6">
                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="text-red-500">{error}</div>
                        <Button onClick={fetchLeaveRequests} className="mt-4">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
                    <p className="text-muted-foreground">
                        Manage employee leave requests, approvals, and balances
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => activeTab === 'requests' ? fetchLeaveRequests() : fetchLeaveBalances(currentPage, perPage)}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${(loading || balancesLoading) ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="requests">Leave Requests</TabsTrigger>
                    <TabsTrigger value="balances">Leave Balances</TabsTrigger>
                </TabsList>

                <TabsContent value="requests" className="space-y-6 mt-6">
                    {/* Leave Summary */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                                <div className="h-4 w-4 bg-yellow-500 rounded-full"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-600">{pendingRequests}</div>
                                <p className="text-xs text-muted-foreground">
                                    Awaiting approval
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                                <div className="h-4 w-4 bg-green-500 rounded-full"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{approvedRequests}</div>
                                <p className="text-xs text-muted-foreground">
                                    This month
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                                <div className="h-4 w-4 bg-red-500 rounded-full"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">{rejectedRequests}</div>
                                <p className="text-xs text-muted-foreground">
                                    This month
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Leave Requests Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>All Leave Requests</CardTitle>
                            <CardDescription>
                                Manage and review employee leave requests
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {leaveRequests.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No leave requests found
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Employee</TableHead>
                                            <TableHead>Leave Type</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Dates</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Applied</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {leaveRequests.map((request) => (
                                            <TableRow key={request.id}>
                                                <TableCell className="flex items-center space-x-3">
                                                    <Avatar>
                                                        <AvatarFallback>
                                                            {getInitials(request.employee.first_name, request.employee.last_name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{getEmployeeName(request.employee)}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {request.employee.email}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={getLeaveTypeColor(request.leave_type.leave_name)}>
                                                        {request.leave_type.leave_name}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{request.total_days} day{request.total_days > 1 ? 's' : ''}</TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {format(new Date(request.start_date), 'MMM dd')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusColor(request.status)}>
                                                        {request.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{format(new Date(request.created_at), 'MMM dd, yyyy')}</TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedRequest(request);
                                                                setIsViewDialogOpen(true);
                                                            }}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {request.status.toLowerCase() === 'pending' && (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleApprove(request.id)}
                                                                    className="text-green-600 hover:text-green-700"
                                                                    disabled={actionLoading === request.id}
                                                                >
                                                                    {actionLoading === request.id ? (
                                                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <Check className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleReject(request.id)}
                                                                    className="text-red-600 hover:text-red-700"
                                                                    disabled={actionLoading === request.id}
                                                                >
                                                                    {actionLoading === request.id ? (
                                                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <X className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="balances" className="space-y-6 mt-6">
                    {/* Balances Summary (aggregated from current page + total count) */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalEmployees}</div>
                                <p className="text-xs text-muted-foreground">Active with leave balances</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Allocated (page)</CardTitle>
                                <div className="h-4 w-4 bg-blue-500 rounded-full"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">{pageAllocated}</div>
                                <p className="text-xs text-muted-foreground">Days on this page</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Used (page)</CardTitle>
                                <div className="h-4 w-4 bg-orange-500 rounded-full"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">{pageUsed}</div>
                                <p className="text-xs text-muted-foreground">Days on this page</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Remaining (page)</CardTitle>
                                <div className="h-4 w-4 bg-green-500 rounded-full"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{pageRemaining}</div>
                                <p className="text-xs text-muted-foreground">Days on this page</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Employee Leave Balances</CardTitle>
                                    <CardDescription>
                                        Allocated, used, and remaining days per employee
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs">Rows</Label>
                                    <Select value={String(perPage)} onValueChange={handlePerPageChange}>
                                        <SelectTrigger className="w-[80px] h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="5">5</SelectItem>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="15">15</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {balancesLoading ? (
                                <div className="flex justify-center items-center py-8">
                                    <RefreshCw className="w-6 h-6 animate-spin" />
                                </div>
                            ) : balancesError ? (
                                <div className="text-center py-8">
                                    <div className="text-red-500">{balancesError}</div>
                                    <Button onClick={() => fetchLeaveBalances(currentPage, perPage)} className="mt-4">
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Retry
                                    </Button>
                                </div>
                            ) : leaveBalances.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No employee leave balances found
                                </div>
                            ) : (
                                <>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Employee</TableHead>
                                                <TableHead>Leave Types</TableHead>
                                                <TableHead className="text-right">Allocated</TableHead>
                                                <TableHead className="text-right">Used</TableHead>
                                                <TableHead className="text-right">Remaining</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {leaveBalances.map((emp) => (
                                                <TableRow key={emp.id}>
                                                    <TableCell>
                                                        <div className="flex items-center space-x-3">
                                                            <Avatar>
                                                                <AvatarFallback>
                                                                    {getInitials(emp.first_name, emp.last_name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="font-medium">{getEmployeeName(emp)}</div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {emp.employee_id}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1 max-w-[320px]">
                                                            {emp.leave_balances.slice(0, 4).map((b) => (
                                                                <Badge
                                                                    key={b.employee_leave_type_id}
                                                                    variant="outline"
                                                                    className={getLeaveTypeColor(b.leave_name || '')}
                                                                    title={`${b.leave_name}: ${b.remaining_days} remaining of ${b.allocated_days}`}
                                                                >
                                                                    {b.leave_name || '—'}: {b.remaining_days}
                                                                </Badge>
                                                            ))}
                                                            {emp.leave_balances.length > 4 && (
                                                                <Badge variant="secondary">
                                                                    +{emp.leave_balances.length - 4} more
                                                                </Badge>
                                                            )}
                                                            {emp.leave_balances.length === 0 && (
                                                                <span className="text-sm text-muted-foreground">No balances</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {emp.summary.total_allocated_days}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {emp.summary.total_used_days}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge variant={emp.summary.total_remaining_days > 0 ? 'default' : 'destructive'}>
                                                            {emp.summary.total_remaining_days}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedBalance(emp);
                                                                setIsBalanceDialogOpen(true);
                                                            }}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {/* Pagination */}
                                    <div className="flex items-center justify-between pt-4">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {paginationFrom}–{paginationTo} of {pagination.total}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage <= 1 || balancesLoading}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <span className="text-sm">
                                                Page {pagination.current_page} of {pagination.last_page}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage >= pagination.last_page || balancesLoading}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Leave Request Details Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Leave Request Details</DialogTitle>
                        <DialogDescription>
                            Complete information for this leave request
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback>
                                        {getInitials(selectedRequest.employee.first_name, selectedRequest.employee.last_name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold">{getEmployeeName(selectedRequest.employee)}</h3>
                                    <p className="text-sm text-muted-foreground">{selectedRequest.employee.email}</p>
                                </div>
                                <div className="ml-auto">
                                    <Badge variant={getStatusColor(selectedRequest.status)}>
                                        {selectedRequest.status}
                                    </Badge>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Leave Type</Label>
                                    <p className="text-sm">
                                        <Badge variant="outline" className={getLeaveTypeColor(selectedRequest.leave_type.leave_name)}>
                                            {selectedRequest.leave_type.leave_name}
                                        </Badge>
                                    </p>
                                </div>
                                <div>
                                    <Label>Duration</Label>
                                    <p className="text-sm">{selectedRequest.total_days} day{selectedRequest.total_days > 1 ? 's' : ''}</p>
                                </div>
                                <div>
                                    <Label>Start Date</Label>
                                    <p className="text-sm">{format(new Date(selectedRequest.start_date), 'PPP')}</p>
                                </div>
                                <div>
                                    <Label>End Date</Label>
                                    <p className="text-sm">{format(new Date(selectedRequest.end_date), 'PPP')}</p>
                                </div>
                                <div className="col-span-2">
                                    <Label>Applied Date</Label>
                                    <p className="text-sm">{format(new Date(selectedRequest.created_at), 'PPP')}</p>
                                </div>
                            </div>
                            <div>
                                <Label>Reason</Label>
                                <p className="text-sm mt-1 p-3 bg-muted rounded-md">{selectedRequest.reason}</p>
                            </div>
                            {selectedRequest.status.toLowerCase() === 'pending' && (
                                <div className="flex space-x-2 pt-4">
                                    <Button
                                        onClick={() => {
                                            handleApprove(selectedRequest.id);
                                            setIsViewDialogOpen(false);
                                        }}
                                        className="flex-1"
                                        disabled={actionLoading === selectedRequest.id}
                                    >
                                        {actionLoading === selectedRequest.id ? (
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Check className="mr-2 h-4 w-4" />
                                        )}
                                        Approve
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            handleReject(selectedRequest.id);
                                            setIsViewDialogOpen(false);
                                        }}
                                        className="flex-1"
                                        disabled={actionLoading === selectedRequest.id}
                                    >
                                        {actionLoading === selectedRequest.id ? (
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <X className="mr-2 h-4 w-4" />
                                        )}
                                        Reject
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Employee Leave Balance Details Dialog */}
            <Dialog open={isBalanceDialogOpen} onOpenChange={setIsBalanceDialogOpen}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle>Leave Balance Details</DialogTitle>
                        <DialogDescription>
                            Allocated, used, and remaining days per leave type
                        </DialogDescription>
                    </DialogHeader>
                    {selectedBalance && (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback>
                                        {getInitials(selectedBalance.first_name, selectedBalance.last_name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold">{getEmployeeName(selectedBalance)}</h3>
                                    <p className="text-sm text-muted-foreground">{selectedBalance.employee_id}</p>
                                </div>
                                <div className="ml-auto text-right">
                                    <div className="text-sm font-medium">
                                        {selectedBalance.summary.total_remaining_days} days left
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {selectedBalance.summary.total_leave_types} leave types
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-3 bg-blue-50 rounded-md text-center">
                                    <div className="text-lg font-bold text-blue-700">{selectedBalance.summary.total_allocated_days}</div>
                                    <div className="text-xs text-muted-foreground">Allocated</div>
                                </div>
                                <div className="p-3 bg-orange-50 rounded-md text-center">
                                    <div className="text-lg font-bold text-orange-700">{selectedBalance.summary.total_used_days}</div>
                                    <div className="text-xs text-muted-foreground">Used</div>
                                </div>
                                <div className="p-3 bg-green-50 rounded-md text-center">
                                    <div className="text-lg font-bold text-green-700">{selectedBalance.summary.total_remaining_days}</div>
                                    <div className="text-xs text-muted-foreground">Remaining</div>
                                </div>
                            </div>

                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                {selectedBalance.leave_balances.map((b) => (
                                    <div key={b.employee_leave_type_id} className="p-3 border rounded-md space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Badge variant="outline" className={getLeaveTypeColor(b.leave_name || '')}>
                                                {b.leave_name || 'Unknown'}
                                            </Badge>
                                            {b.is_paid ? (
                                                <Badge variant="default">Paid</Badge>
                                            ) : (
                                                <Badge variant="secondary">Unpaid</Badge>
                                            )}
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Allocated: <strong>{b.allocated_days}</strong></span>
                                            <span>Used: <strong>{b.used_days}</strong></span>
                                            <span>Remaining: <strong>{b.remaining_days}</strong></span>
                                        </div>
                                        <Progress value={getBalanceUsagePercent(b)} className="h-2" />
                                    </div>
                                ))}
                                {selectedBalance.leave_balances.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No leave balances assigned.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default LeaveManagement;
