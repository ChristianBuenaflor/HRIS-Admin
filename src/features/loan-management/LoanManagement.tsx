import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Banknote,
    Eye,
    CheckCircle2,
    XCircle,
    Clock,
    TrendingUp,
    DollarSign,
    Trash2,
    AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/axios';

// Types based on your backend
interface Employee {
    id: string;
    employee_id: string;
    first_name: string;
    last_name: string;
    status: string;
}

interface LoanType {
    id: string;
    type_name: string;
    description: string;
    amount: number;
    amount_limit: number;
    interest: number;
    is_archived: boolean;
}

interface Loan {
    id: string;
    employee_id: string;
    loan_type_id: string;
    principal_amount: number;
    balance_amount: number;
    monthly_amortization: number;
    interest_rate: number;
    start_date?: string;
    end_date: string;
    status: 'pending' | 'active' | 'paid' | 'defaulted' | 'cancelled';
    remarks?: string;
    created_at: string;
    loanType?: LoanType;
    employee?: Employee;
    approved_by?: string;
    approved_date?: string;
}

// Frontend mapped interface
interface EmployeeLoan {
    id: string;
    employeeId: string;
    employeeName: string;
    loanTypeId: string;
    loanTypeName: string;
    principal: number;
    interestRate: number;
    monthlyDeduction: number;
    totalAmount: number;
    balance: number;
    termMonths: number;
    monthsPaid: number;
    status: 'pending' | 'active' | 'completed' | 'rejected';
    applicationDate: string;
    purpose: string;
    approvedDate?: string;
    approvedBy?: string;
    startDate?: string;
    endDate?: string;
    rejectedReason?: string;
}

export function LoanManagement() {
    const [loans, setLoans] = useState<EmployeeLoan[]>([]);
    const [, setEmployees] = useState<Employee[]>([]);
    const [loanTypes, setLoanTypes] = useState<LoanType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showLoanDetails, setShowLoanDetails] = useState<EmployeeLoan | null>(null);
    const [showApprovalDialog, setShowApprovalDialog] = useState<EmployeeLoan | null>(null);
    const [activeTab, setActiveTab] = useState('applications');
    const [filterStatus,] = useState('all');



    const [rejectionReason, setRejectionReason] = useState('');

    // Fetch data on component mount
    useEffect(() => {
        fetchLoans();
        fetchEmployees();
        fetchLoanTypes();
    }, []);

    const fetchLoans = async () => {
        try {
            setLoading(true);
            const response = await api.get('/loans');
            if (response.data.success) {
                const backendLoans: Loan[] = response.data.data.data || response.data.data;
                const mappedLoans = backendLoans.map(mapBackendLoanToFrontend);
                setLoans(mappedLoans);
            }
        } catch (error) {
            console.error('Error fetching loans:', error);
            toast.error('Failed to fetch loans');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem('token')
            // You'll need to create this endpoint or use your existing employees API
            const response = await api.get('/employees', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }); // Adjust endpoint as needed
            if (response.data.success) {
                setEmployees(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            toast.error('Failed to fetch employees');
        }
    };

    const fetchLoanTypes = async () => {
        try {
            // You'll need to create this endpoint
            const response = await api.get('/loan-types'); // Adjust endpoint as needed
            if (response.data.success) {
                setLoanTypes(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching loan types:', error);
            toast.error('Failed to fetch loan types');
        }
    };

    // Map backend loan to frontend format
    const mapBackendLoanToFrontend = (backendLoan: Loan): EmployeeLoan => {
        const startDate = backendLoan.start_date ? new Date(backendLoan.start_date) : new Date(backendLoan.created_at);
        const endDate = new Date(backendLoan.end_date);
        const termMonths = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));

        // Derive paid installments from actual balance movement, not elapsed time.
        // Backend provides no payment ledger here, so paid = (original total - remaining balance).
        const interestRate = Number(backendLoan.interest_rate) || 0;
        const principal = Number(backendLoan.principal_amount) || 0;
        const balance = Number(backendLoan.balance_amount) || 0;
        const monthly = Number(backendLoan.monthly_amortization) || 0;
        const totalWithInterest = principal * (1 + interestRate / 100);
        const totalAmount = Math.max(totalWithInterest, principal, balance);
        const paidAmount = Math.max(0, totalAmount - balance);
        const monthsPaid = backendLoan.status === 'paid'
            ? termMonths
            : monthly > 0
                ? Math.min(termMonths, Math.floor(paidAmount / monthly))
                : 0;

        // Map backend status to frontend status
        const statusMap = {
            'pending': 'pending',
            'active': 'active',
            'paid': 'completed',
            'defaulted': 'active', // or create a new status for defaulted
            'cancelled': 'rejected'
        } as const;

        return {
            id: backendLoan.id.toString(),
            employeeId: backendLoan.employee_id,
            employeeName: backendLoan.employee
                ? `${backendLoan.employee.first_name} ${backendLoan.employee.last_name}`
                : 'Unknown Employee',
            loanTypeId: backendLoan.loan_type_id,
            loanTypeName: backendLoan.loanType?.type_name || 'Unknown Type',
            principal: backendLoan.principal_amount,
            interestRate: backendLoan.interest_rate,
            monthlyDeduction: backendLoan.monthly_amortization,
            totalAmount,
            balance: backendLoan.balance_amount,
            termMonths,
            monthsPaid,
            status: statusMap[backendLoan.status],
            applicationDate: backendLoan.created_at.split('T')[0],
            purpose: backendLoan.remarks || 'No purpose specified',
            approvedDate: backendLoan.approved_date,
            approvedBy: backendLoan.approved_by,
            startDate: backendLoan.start_date,
            endDate: backendLoan.end_date,
        };
    };

    // Calculate loan statistics
    const activeLoans = loans.filter(l => l.status === 'active');
    const pendingLoans = loans.filter(l => l.status === 'pending');
    const totalDisbursed = activeLoans.reduce((sum, l) => sum + l.principal, 0);
    const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.balance, 0);



    const handleApproveLoan = async () => {
        if (!showApprovalDialog) return;

        try {
            const response = await api.post(`/loans/${showApprovalDialog.id}/approve`);

            if (response.data.success) {
                await fetchLoans(); // Refresh the loans list
                toast.success(`Loan ${showApprovalDialog.id} approved successfully!`);
                setShowApprovalDialog(null);
            } else {
                toast.error(response.data.message || 'Failed to approve loan');
            }
        } catch (error: any) {
            console.error('Error approving loan:', error);
            toast.error(error.response?.data?.message || 'Failed to approve loan');
        }
    };

    const handleRejectLoan = async () => {
        if (!showApprovalDialog || !rejectionReason) {
            toast.error('Please provide a rejection reason');
            return;
        }

        try {
            const response = await api.post(`/loans/${showApprovalDialog.id}/cancel`);

            if (response.data.success) {
                // Update the loan with rejection reason
                setLoans(loans.map(loan =>
                    loan.id === showApprovalDialog.id
                        ? {
                            ...loan,
                            status: 'rejected',
                            rejectedReason: rejectionReason,
                        }
                        : loan
                ));

                toast.success(`Loan ${showApprovalDialog.id} rejected`);
                setShowApprovalDialog(null);
                setRejectionReason('');
            } else {
                toast.error(response.data.message || 'Failed to reject loan');
            }
        } catch (error: any) {
            console.error('Error rejecting loan:', error);
            toast.error(error.response?.data?.message || 'Failed to reject loan');
        }
    };

    const handleDeleteLoan = async (loanId: string) => {
        try {
            const response = await api.post(`/loans/${loanId}/cancel`);

            if (response.data.success) {
                setLoans(loans.filter(l => l.id !== loanId));
                toast.success('Loan cancelled successfully');
            } else {
                toast.error(response.data.message || 'Failed to cancel loan');
            }
        } catch (error: any) {
            console.error('Error cancelling loan:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel loan');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
            case 'active':
                return <Badge className="bg-green-600"><TrendingUp className="w-3 h-3 mr-1" /> Active</Badge>;
            case 'rejected':
                return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
            case 'completed':
                return <Badge className="bg-blue-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    // Filter loans based on active tab
    const getFilteredLoans = () => {
        let filtered = loans;

        if (activeTab === 'applications') {
            filtered = loans.filter(l => l.status === 'pending');
        } else if (activeTab === 'active') {
            filtered = loans.filter(l => l.status === 'active');
        } else if (activeTab === 'completed') {
            filtered = loans.filter(l => l.status === 'completed');
        }

        if (filterStatus !== 'all') {
            filtered = filtered.filter(l => l.status === filterStatus);
        }

        return filtered;
    };

    const filteredLoans = getFilteredLoans();



    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center">
                <div className="text-center">Loading loans...</div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Loan Management</h2>
                    <p className="text-sm text-muted-foreground">Manage employee loan applications and repayments</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active Loans</p>
                                <p className="text-2xl font-bold">{activeLoans.length}</p>
                            </div>
                            <Banknote className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pending Applications</p>
                                <p className="text-2xl font-bold">{pendingLoans.length}</p>
                            </div>
                            <Clock className="w-8 h-8 text-amber-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Disbursed</p>
                                <p className="text-2xl font-bold">₱{totalDisbursed.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                                <p className="text-2xl font-bold">₱{totalOutstanding.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Loan Types Reference */}
            <Card>
                <CardHeader>
                    <CardTitle>Available Loan Types</CardTitle>
                    <CardDescription>Loan products available for employees</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {loanTypes.filter(lt => !lt.is_archived).map((loanType) => (
                            <div key={loanType.id} className="p-4 border rounded-lg">
                                <h4 className="font-semibold mb-2">{loanType.type_name}</h4>
                                <p className="text-sm text-muted-foreground mb-3">{loanType.description}</p>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span>Base Amount:</span>
                                        <span className="font-medium">₱{loanType.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Max Limit:</span>
                                        <span className="font-medium">₱{loanType.amount_limit.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Interest Rate:</span>
                                        <span className="font-medium">{loanType.interest}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Loans Table with Tabs */}
            <Card>
                <CardHeader>
                    <CardTitle>Employee Loans</CardTitle>
                    <CardDescription>View and manage all employee loans</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="mb-4">
                            <TabsTrigger value="applications">
                                Pending Applications ({pendingLoans.length})
                            </TabsTrigger>
                            <TabsTrigger value="active">
                                Active Loans ({activeLoans.length})
                            </TabsTrigger>
                            <TabsTrigger value="completed">
                                Completed
                            </TabsTrigger>
                            <TabsTrigger value="all">All Loans</TabsTrigger>
                        </TabsList>

                        <TabsContent value={activeTab} className="space-y-4">
                            {filteredLoans.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    No loans found in this category
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Employee</TableHead>
                                                <TableHead>Loan Type</TableHead>
                                                <TableHead className="text-right">Principal</TableHead>
                                                <TableHead className="text-right">Monthly Deduction</TableHead>
                                                <TableHead className="text-right">Balance</TableHead>
                                                <TableHead className="text-center">Progress</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Application Date</TableHead>
                                                <TableHead className="text-center">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredLoans.map((loan) => {
                                                const progress = ((loan.monthsPaid / loan.termMonths) * 100).toFixed(0);
                                                return (
                                                    <TableRow key={loan.id}>
                                                        <TableCell>
                                                            <div className="flex items-center space-x-3">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarFallback>
                                                                        {loan.employeeName.split(' ').map(n => n[0]).join('')}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <div className="font-medium">{loan.employeeName}</div>
                                                                    <div className="text-sm text-muted-foreground">{loan.employeeId}</div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <div className="font-medium">{loan.loanTypeName}</div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {loan.termMonths} months @ {loan.interestRate}%
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            ₱{loan.principal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            ₱{loan.monthlyDeduction.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div>
                                                                <div className="font-medium">
                                                                    ₱{loan.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    of ₱{loan.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <Progress value={parseFloat(progress)} className="flex-1" />
                                                                    <span className="text-xs text-muted-foreground w-12">{progress}%</span>
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {loan.monthsPaid} / {loan.termMonths} months
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{getStatusBadge(loan.status)}</TableCell>
                                                        <TableCell>
                                                            <div className="text-sm">
                                                                {new Date(loan.applicationDate).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                })}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex justify-center gap-1">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setShowLoanDetails(loan)}
                                                                >
                                                                    <Eye className="w-3 h-3" />
                                                                </Button>
                                                                {loan.status === 'pending' && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => setShowApprovalDialog(loan)}
                                                                    >
                                                                        <CheckCircle2 className="w-3 h-3" />
                                                                    </Button>
                                                                )}
                                                                {(loan.status === 'pending' || loan.status === 'rejected') && (
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        onClick={() => handleDeleteLoan(loan.id)}
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>



            {/* Loan Details Dialog */}
            {showLoanDetails && (
                <Dialog open={!!showLoanDetails} onOpenChange={() => setShowLoanDetails(null)}>
                    <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader className=" bg-white z-10 pb-2 border-b">
                            <DialogTitle>Loan Details - {showLoanDetails.id}</DialogTitle>
                            <DialogDescription>Complete information about this loan</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            {/* Employee & Loan Type Info */}
                            <div className="grid grid-cols-2 gap-6 p-4 bg-indigo-700 text-white rounded-lg">
                                <div>
                                    <h4 className="font-semibold mb-3">Employee Information</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-background">Name:</span>
                                            <span className="font-medium">{showLoanDetails.employeeName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-background">Employee ID:</span>
                                            <span className="font-medium">{showLoanDetails.employeeId}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-3">Loan Information</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-background">Loan Type:</span>
                                            <span className="font-medium">{showLoanDetails.loanTypeName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-background">Status:</span>
                                            <span>{getStatusBadge(showLoanDetails.status)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Details */}
                            <div className="rounded-lg border p-4 bg-white">
                                <h4 className="font-semibold mb-4">Financial Details</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Card>
                                        <CardContent className="p-4">
                                            <p className="text-sm text-muted-foreground">Principal Amount</p>
                                            <p className="text-xl font-bold">
                                                ₱{showLoanDetails.principal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-4">
                                            <p className="text-sm text-muted-foreground">Interest Rate</p>
                                            <p className="text-xl font-bold">{showLoanDetails.interestRate}%</p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-4">
                                            <p className="text-sm text-muted-foreground">Total Amount</p>
                                            <p className="text-xl font-bold">
                                                ₱{showLoanDetails.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-4">
                                            <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                                            <p className="text-xl font-bold text-red-600">
                                                ₱{showLoanDetails.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            {/* Repayment Progress */}
                            <div>
                                <h4 className="font-semibold mb-3">Repayment Progress</h4>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span>Payment Progress</span>
                                            <span className="font-medium">
                                                {showLoanDetails.monthsPaid} of {showLoanDetails.termMonths} months
                                            </span>
                                        </div>
                                        <Progress value={(showLoanDetails.monthsPaid / showLoanDetails.termMonths) * 100} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Monthly Deduction:</span>
                                            <p className="font-semibold">
                                                ₱{showLoanDetails.monthlyDeduction.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Months Paid:</span>
                                            <p className="font-semibold">{showLoanDetails.monthsPaid}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Remaining Months:</span>
                                            <p className="font-semibold">
                                                {showLoanDetails.termMonths - showLoanDetails.monthsPaid}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Dates */}
                            <div>
                                <h4 className="font-semibold mb-3">Important Dates</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Application Date:</span>
                                        <p className="font-medium">{new Date(showLoanDetails.applicationDate).toLocaleDateString()}</p>
                                    </div>
                                    {showLoanDetails.approvedDate && (
                                        <div>
                                            <span className="text-muted-foreground">Approved Date:</span>
                                            <p className="font-medium">{new Date(showLoanDetails.approvedDate).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                    {showLoanDetails.startDate && (
                                        <div>
                                            <span className="text-muted-foreground">Start Date:</span>
                                            <p className="font-medium">{new Date(showLoanDetails.startDate).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                    {showLoanDetails.endDate && (
                                        <div>
                                            <span className="text-muted-foreground">End Date:</span>
                                            <p className="font-medium">{new Date(showLoanDetails.endDate).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Purpose */}
                            <div>
                                <h4 className="font-semibold mb-2">Loan Purpose</h4>
                                <p className="text-sm text-muted-foreground">{showLoanDetails.purpose}</p>
                            </div>

                            {/* Rejection Reason */}
                            {showLoanDetails.rejectedReason && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-red-900">Rejection Reason</h4>
                                            <p className="text-sm text-red-800">{showLoanDetails.rejectedReason}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="sticky bottom-0 bg-white/5 pt-3 ">
                            <Button variant="outline" onClick={() => setShowLoanDetails(null)}>
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Approval Dialog */}
            {showApprovalDialog && (
                <Dialog open={!!showApprovalDialog} onOpenChange={() => setShowApprovalDialog(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Approve or Reject Loan</DialogTitle>
                            <DialogDescription>Review the loan application and make a decision</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Employee:</span>
                                    <span className="font-medium">{showApprovalDialog.employeeName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Loan Type:</span>
                                    <span className="font-medium">{showApprovalDialog.loanTypeName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Amount:</span>
                                    <span className="font-medium">₱{showApprovalDialog.principal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Monthly Deduction:</span>
                                    <span className="font-medium">₱{showApprovalDialog.monthlyDeduction.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="rejection-reason">Rejection Reason (if rejecting)</Label>
                                <Textarea
                                    id="rejection-reason"
                                    placeholder="Enter reason for rejection..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setShowApprovalDialog(null)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleRejectLoan}>
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                            </Button>
                            <Button onClick={handleApproveLoan}>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Approve
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}