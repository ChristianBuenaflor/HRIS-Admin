import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Search, Edit, Eye, Users, UserCheck, UserX, Plus, Download, Filter, PhilippinePeso, FileCheck, FileText } from "lucide-react";
import EmployeeDialog from './components/EmployeeDialog';
import CreateEmployeeModal from './components/CreateEmployeeModal';
import api from '@/utils/axios'
import type {
    Employee,
    Department,
    PositionType,
    BenefitType
} from './employeeTS';

const Employees = () => {
    const getToken = () => localStorage.getItem('token') ?? '';
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<PositionType[]>([]);
    const [benefitTypes, setBenefitTypes] = useState<BenefitType[]>([]);
    const [allowanceTypes, setAllowanceTypes] = useState<any[]>([]);
    const [, setManagers] = useState<Employee[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        department_id: '',
        position_id: '',
        benefit_id: '',
        allowance_id: ''
    });
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState({ total_employees: 0, active_employees: 0, inactive_employees: 0 });
    const [pagination, setPagination] = useState({ current_page: 1, per_page: 50, total: 0, last_page: 1 });

    // Fetch employees with search, filters and pagination
    const fetchEmployees = async (page = 1, search = searchTerm, filterParams = filters, perPage?: number) => {
        try {
            setLoading(true);
            const effectivePerPage = perPage ?? pagination.per_page;

            // Build query parameters
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: effectivePerPage.toString(),
                ...(search && { search }),
                ...(filterParams.department_id && { department_id: filterParams.department_id }),
                ...(filterParams.position_id && { position_id: filterParams.position_id }),
                ...(filterParams.benefit_id && { benefit_id: filterParams.benefit_id }),
                ...(filterParams.allowance_id && { allowance_id: filterParams.allowance_id }),
            });

            const response = await api.get(`/employees?${params}`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`
                }
            });
            const result = response.data;

            if (result.isSuccess) {
                setEmployees(result.employees || []);
                setSummary(result.summary || { total_employees: 0, active_employees: 0, inactive_employees: 0 });
                setPagination(result.pagination);
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Search handler with debounce
    const handleSearch = (value: string) => {
        setSearchTerm(value);
        // Reset to page 1 when searching
        fetchEmployees(1, value, filters);
    };

    // Filter handlers
    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        // Reset to page 1 when filtering
        fetchEmployees(1, searchTerm, newFilters);
    };

    const clearFilters = () => {
        const clearedFilters = {
            department_id: '',
            position_id: '',
            benefit_id: '',
            allowance_id: ''
        };
        setFilters(clearedFilters);
        fetchEmployees(1, searchTerm, clearedFilters);
    };

    // Pagination handler
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.last_page) {
            fetchEmployees(newPage, searchTerm, filters);
        }
    };

    // Per page handler
    const handlePerPageChange = (newPerPage: number) => {
        setPagination(prev => ({ ...prev, per_page: newPerPage, current_page: 1 }));
        fetchEmployees(1, searchTerm, filters, newPerPage);
    };

    // Fetch employee details for view dialog
    const fetchEmployeeDetails = async (employeeId: number) => {
        try {
            const response = await api.get(`/employees/${employeeId}`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`
                }
            });
            const result = response.data;

            if (result.isSuccess) {
                return result.employee;
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch employee details');
            return null;
        }
    };

    // Fetch dropdown data
    const fetchDropdownData = async () => {
        try {
            const [deptResponse, posResponse, mgrResponse] = await Promise.all([
                api.get('/departments'),
                api.get('/dropdown/position-types'),
                api.get('/dropdown/employees')
            ]);

            if (deptResponse.data.isSuccess) {
                setDepartments(deptResponse.data.data);
            }

            if (posResponse.data.isSuccess) {
                setPositions(posResponse.data.data);
            }

            if (mgrResponse.data.isSuccess) {
                setManagers(mgrResponse.data.data);
            }
        } catch (err) {
            console.error('Error fetching dropdown data:', err);
        }
    };

    // Fetch benefit types
    const fetchBenefitTypes = async () => {
        try {
            const response = await api.get('/dropdown/benefit-types', {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            if (response.data.isSuccess) {
                setBenefitTypes(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching benefit types:', err);
        }
    };

    // Fetch allowance types
    const fetchAllowanceTypes = async () => {
        try {
            const response = await api.get('/dropdown/allowance-types', {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            if (response.data.isSuccess) {
                setAllowanceTypes(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching allowance types:', err);
        }
    };

    useEffect(() => {
        fetchEmployees();
        fetchDropdownData();
        fetchBenefitTypes();
        fetchAllowanceTypes();
    }, []);

    const handleViewEmployee = async (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsViewDialogOpen(true);

        // Fetch detailed employee data including files
        const detailedEmployee = await fetchEmployeeDetails(employee.id);
        if (detailedEmployee) {
            setSelectedEmployee(detailedEmployee);
        }
    };

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    const getManagerName = (employee: Employee) => {
        if (employee.manager) {
            return `${employee.manager.first_name} ${employee.manager.last_name}`;
        }
        return employee.manager_id ? 'Manager not loaded' : 'No Manager';
    };

    const formatSalary = (salary: string | number) => {
        const numSalary = typeof salary === 'string' ? parseFloat(salary) : salary;
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(numSalary);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // const formatDateTime = (dateString: string) => {
    //     if (!dateString) return 'N/A';
    //     return new Date(dateString).toLocaleDateString('en-PH', {
    //         year: 'numeric',
    //         month: 'long',
    //         day: 'numeric',
    //         hour: '2-digit',
    //         minute: '2-digit'
    //     });
    // };

    const renderField = (value: any, fallback = 'N/A') => {
        return value ? value : fallback;
    };

    const downloadFile = (fileUrl: string, fileName: string) => {
        if (fileUrl) {
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = fileName;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    if (loading && employees.length === 0) {
        return (
            <div className="p-6 flex items-center justify-center min-h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading employees...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                    <button onClick={() => setError(null)} className="absolute top-0 right-0 px-4 py-3">×</button>
                </div>
                <Button onClick={() => fetchEmployees()} className="mt-4">
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header Section */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Employee Management</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your organization's workforce efficiently
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add Employee
                    </Button>
                </div>
                <EmployeeDialog
                    editingEmployee={editingEmployee}
                    setEditingEmployee={setEditingEmployee}
                    departments={departments}
                    positions={positions}
                    benefitTypes={benefitTypes}
                    onEmployeeAdded={() => fetchEmployees(pagination.current_page, searchTerm, filters)}
                    onEmployeeUpdated={() => fetchEmployees(pagination.current_page, searchTerm, filters)}
                    onEmployeeArchived={() => fetchEmployees(pagination.current_page, searchTerm, filters)}
                />
                <CreateEmployeeModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onEmployeeCreated={() => {
                        fetchEmployees(pagination.current_page, searchTerm, filters);
                        setIsCreateModalOpen(false);
                    }}
                    departments={departments}
                    positions={positions}
                    benefitTypes={benefitTypes}
                    allowanceTypes={allowanceTypes}
                    managers={employees.filter(emp => emp.role === 'manager' || emp.role === 'admin')}
                    employmentTypes={[]} // You'll need to fetch this from your API
                />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total_employees}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active</CardTitle>
                        <UserCheck className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{summary.active_employees}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inactive</CardTitle>
                        <UserX className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{summary.inactive_employees}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {summary.total_employees > 0
                                ? Math.round((summary.active_employees / summary.total_employees) * 100)
                                : 0}%
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Employee Directory</CardTitle>
                            <CardDescription>
                                Browse and manage all employees in your organization
                            </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-initial">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search employees..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-8 w-full sm:w-64"
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                Filter
                                {(filters.department_id || filters.position_id || filters.benefit_id || filters.allowance_id) && (
                                    <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                                        Active
                                    </Badge>
                                )}
                            </Button>
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                        </div>
                    </div>

                    {/* Filter Section */}
                    {isFilterOpen && (
                        <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Department Filter */}
                                <div className="space-y-2">
                                    <Label htmlFor="department-filter">Department</Label>
                                    <select
                                        id="department-filter"
                                        value={filters.department_id}
                                        onChange={(e) => handleFilterChange('department_id', e.target.value)}
                                        className="w-full p-2 border rounded-md bg-background"
                                    >
                                        <option value="">All Departments</option>
                                        {departments.map((dept) => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.department_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Position Filter */}
                                <div className="space-y-2">
                                    <Label htmlFor="position-filter">Position</Label>
                                    <select
                                        id="position-filter"
                                        value={filters.position_id}
                                        onChange={(e) => handleFilterChange('position_id', e.target.value)}
                                        className="w-full p-2 border rounded-md bg-background"
                                    >
                                        <option value="">All Positions</option>
                                        {positions.map((position) => (
                                            <option key={position.id} value={position.id}>
                                                {position.position_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Benefit Filter */}
                                <div className="space-y-2">
                                    <Label htmlFor="benefit-filter">Benefit</Label>
                                    <select
                                        id="benefit-filter"
                                        value={filters.benefit_id}
                                        onChange={(e) => handleFilterChange('benefit_id', e.target.value)}
                                        className="w-full p-2 border rounded-md bg-background"
                                    >
                                        <option value="">All Benefits</option>
                                        {benefitTypes.map((benefit) => (
                                            <option key={benefit.id} value={benefit.id}>
                                                {benefit.benefit_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Allowance Filter */}
                                <div className="space-y-2">
                                    <Label htmlFor="allowance-filter">Allowance</Label>
                                    <select
                                        id="allowance-filter"
                                        value={filters.allowance_id}
                                        onChange={(e) => handleFilterChange('allowance_id', e.target.value)}
                                        className="w-full p-2 border rounded-md bg-background"
                                    >
                                        <option value="">All Allowances</option>
                                        {allowanceTypes.map((allowance) => (
                                            <option key={allowance.id} value={allowance.id}>
                                                {allowance.type_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Clear Filters */}
                            {(filters.department_id || filters.position_id || filters.benefit_id || filters.allowance_id) && (
                                <div className="mt-4 flex justify-end">
                                    <Button variant="outline" size="sm" onClick={clearFilters}>
                                        Clear All Filters
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Position</TableHead>
                                    <TableHead>Manager</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Salary</TableHead>
                                    <TableHead>Hire Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            {loading ? 'Loading employees...' : 'No employees found'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    employees.map((employee) => (
                                        <TableRow key={employee.id} className="hover:bg-muted/50">
                                            <TableCell>
                                                <div className="flex items-center space-x-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarFallback className="bg-primary/10 text-primary">
                                                            {getInitials(employee.first_name, employee.last_name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-medium truncate">
                                                            {employee.first_name} {employee.middle_name} {employee.last_name} {employee.suffix}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground truncate">
                                                            {employee.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-normal">
                                                    {employee.department?.department_name || 'N/A'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{employee.position?.position_name || 'N/A'}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {getManagerName(employee)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <Badge
                                                        variant={employee.is_active ? "default" : "secondary"}
                                                        className={employee.is_active ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                                                    >
                                                        {employee.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>

                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {formatSalary(employee.base_salary)}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDate(employee.hire_date)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end space-x-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewEmployee(employee)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setEditingEmployee(employee)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {pagination.last_page > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 py-4">
                            <div className="flex items-center space-x-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                                    {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                                    {pagination.total} entries
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Label htmlFor="per-page" className="text-sm">Rows:</Label>
                                    <select
                                        id="per-page"
                                        value={pagination.per_page}
                                        onChange={(e) => handlePerPageChange(parseInt(e.target.value))}
                                        className="p-1 border rounded text-sm"
                                    >
                                        <option value="5">5</option>
                                        <option value="10">10</option>
                                        <option value="20">20</option>
                                        <option value="50">50</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.current_page - 1)}
                                    disabled={pagination.current_page === 1}
                                >
                                    Previous
                                </Button>
                                <div className="flex items-center space-x-1">
                                    {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                                        let pageNum;
                                        if (pagination.last_page <= 5) {
                                            pageNum = i + 1;
                                        } else if (pagination.current_page <= 3) {
                                            pageNum = i + 1;
                                        } else if (pagination.current_page >= pagination.last_page - 2) {
                                            pageNum = pagination.last_page - 4 + i;
                                        } else {
                                            pageNum = pagination.current_page - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={pagination.current_page === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handlePageChange(pageNum)}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.current_page + 1)}
                                    disabled={pagination.current_page === pagination.last_page}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Employee Details Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Employee Details</DialogTitle>
                        <DialogDescription>
                            Complete information for {selectedEmployee?.first_name} {selectedEmployee?.last_name}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedEmployee && (
                        <Tabs defaultValue="personal" className="w-full">
                            <TabsList className="grid w-full grid-cols-9">
                                <TabsTrigger value="personal">Personal</TabsTrigger>
                                <TabsTrigger value="government">Government</TabsTrigger>
                                <TabsTrigger value="address">Address</TabsTrigger>
                                <TabsTrigger value="family">Family</TabsTrigger>
                                <TabsTrigger value="education">Education</TabsTrigger>
                                <TabsTrigger value="employment">Employment</TabsTrigger>
                                <TabsTrigger value="benefits">Benefits</TabsTrigger>
                                <TabsTrigger value="allowances">Allowances</TabsTrigger>
                                <TabsTrigger value="files">Files</TabsTrigger>
                            </TabsList>

                            {/* Personal Information Tab */}
                            <TabsContent value="personal" className="space-y-4">
                                <div className="flex items-center space-x-4 pb-4">
                                    <Avatar className="h-20 w-20">
                                        <AvatarFallback className="text-lg bg-primary/10 text-primary">
                                            {getInitials(selectedEmployee.first_name, selectedEmployee.last_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold">
                                            {selectedEmployee.first_name} {selectedEmployee.middle_name} {selectedEmployee.last_name} {selectedEmployee.suffix}
                                        </h3>
                                        <p className="text-muted-foreground">{selectedEmployee.position?.position_name || 'N/A'}</p>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <Badge variant={selectedEmployee.is_active ? "default" : "secondary"}>
                                                {selectedEmployee.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                            <Badge variant="outline">{selectedEmployee.role}</Badge>
                                            {selectedEmployee.is_archived && (
                                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                                    Archived
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Basic Information */}
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                            Basic Information
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <Label className="text-sm">Employee ID</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.employee_id)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Email</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.email)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Phone</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.phone)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Date of Birth</Label>
                                                <p className="text-sm mt-1">{formatDate(selectedEmployee.date_of_birth)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Place of Birth</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.place_of_birth)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Sex</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.sex)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Civil Status</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.civil_status)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Physical Attributes */}
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                            Physical Attributes
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <Label className="text-sm">Height</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.height_m)} m</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Weight</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.weight_kg)} kg</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Blood Type</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.blood_type)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Citizenship</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.citizenship)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Government IDs Tab */}
                            <TabsContent value="government" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Government Identification Numbers</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <Label className="text-sm">GSIS No.</Label>
                                                    <p className="text-sm mt-1">{renderField(selectedEmployee.gsis_no)}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-sm">PAG-IBIG No.</Label>
                                                    <p className="text-sm mt-1">{renderField(selectedEmployee.pagibig_no)}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-sm">PhilHealth No.</Label>
                                                    <p className="text-sm mt-1">{renderField(selectedEmployee.philhealth_no)}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label className="text-sm">SSS No.</Label>
                                                    <p className="text-sm mt-1">{renderField(selectedEmployee.sss_no)}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-sm">TIN No.</Label>
                                                    <p className="text-sm mt-1">{renderField(selectedEmployee.tin_no)}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-sm">Agency Employee No.</Label>
                                                    <p className="text-sm mt-1">{renderField(selectedEmployee.agency_employee_no)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Address Information Tab */}
                            <TabsContent value="address" className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Residential Address */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Residential Address</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div>
                                                <Label className="text-sm">Address</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.residential_address)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Zip Code</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.residential_zipcode)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Telephone Number</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.residential_tel_no)}</p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Permanent Address */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Permanent Address</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div>
                                                <Label className="text-sm">Address</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.permanent_address)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Zip Code</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.permanent_zipcode)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Telephone Number</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.permanent_tel_no)}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Emergency Contact */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Emergency Contact</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <Label className="text-sm">Contact Name</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.emergency_contact_name)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Contact Number</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.emergency_contact_number)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Relationship</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.emergency_contact_relation)}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Family Information Tab */}
                            <TabsContent value="family" className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Parents Information */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Parents Information</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div>
                                                <Label className="text-sm">Father's Name</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.father_name)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Mother's Name</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.mother_name)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Parents' Address</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.parents_address)}</p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Spouse Information */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Spouse Information</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div>
                                                <Label className="text-sm">Spouse's Name</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.spouse_name)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Spouse's Occupation</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.spouse_occupation)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Spouse's Employer</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.spouse_employer)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Spouse's Telephone</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.spouse_tel_no)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Spouse's Business Address</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.spouse_business_address)}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            {/* Education Tab */}
                            <TabsContent value="education" className="space-y-6">
                                {/* Educational Background */}
                                <div className="space-y-4">
                                    {/* Elementary */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Elementary Education</CardTitle>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-sm">School Name</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.elementary_school_name)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Degree/Course</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.elementary_degree_course)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Year Graduated</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.elementary_year_graduated)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Highest Level</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.elementary_highest_level)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Inclusive Dates</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.elementary_inclusive_dates)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Honors/Awards</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.elementary_honors)}</p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Secondary */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Secondary Education</CardTitle>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-sm">School Name</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.secondary_school_name)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Degree/Course</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.secondary_degree_course)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Year Graduated</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.secondary_year_graduated)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Highest Level</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.secondary_highest_level)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Inclusive Dates</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.secondary_inclusive_dates)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Honors/Awards</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.secondary_honors)}</p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* College */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>College Education</CardTitle>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-sm">School Name</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.college_school_name)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Degree/Course</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.college_degree_course)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Year Graduated</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.college_year_graduated)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Highest Level</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.college_highest_level)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Inclusive Dates</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.college_inclusive_dates)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Honors/Awards</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.college_honors)}</p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Graduate Studies */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Graduate Studies</CardTitle>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-sm">School Name</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.graduate_school_name)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Degree/Course</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.graduate_degree_course)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Year Graduated</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.graduate_year_graduated)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Highest Level</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.graduate_highest_level)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Inclusive Dates</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.graduate_inclusive_dates)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Honors/Awards</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.graduate_honors)}</p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Vocational */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Vocational Education</CardTitle>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-sm">School Name</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.vocational_school_name)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Degree/Course</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.vocational_degree_course)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Year Graduated</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.vocational_year_graduated)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Highest Level</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.vocational_highest_level)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Inclusive Dates</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.vocational_inclusive_dates)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Honors/Awards</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.vocational_honors)}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            {/* Employment Information Tab */}
                            <TabsContent value="employment" className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Employment Details */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Employment Details</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div>
                                                <Label className="text-sm">Department</Label>
                                                <p className="text-sm mt-1 font-medium">
                                                    {selectedEmployee.department?.department_name || 'N/A'}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {selectedEmployee.department?.description}
                                                </p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Position</Label>
                                                <p className="text-sm mt-1 font-medium">
                                                    {selectedEmployee.position?.position_name || 'N/A'}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {selectedEmployee.position?.description}
                                                </p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Manager</Label>
                                                <p className="text-sm mt-1">{getManagerName(selectedEmployee)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Employment Type</Label>
                                                <p className="text-sm mt-1">{renderField(selectedEmployee.employment_type_id)}</p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Compensation & Dates */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Compensation & Dates</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div>
                                                <Label className="text-sm">Daily Salary</Label>
                                                <p className="text-sm font-medium mt-1">{formatSalary(selectedEmployee.base_salary)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Hire Date</Label>
                                                <p className="text-sm mt-1">{formatDate(selectedEmployee.hire_date)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Shift Start</Label>
                                                <p className="text-sm mt-1">{formatDate(selectedEmployee.shift_start)}</p>
                                            </div>
                                              <div>
                                                <Label className="text-sm">Shift End</Label>
                                                <p className="text-sm mt-1">{formatDate(selectedEmployee.shift_end)}</p>
                                            </div>
                                            {/* <div>
                                                <Label className="text-sm">Created At</Label>
                                                <p className="text-sm mt-1">{formatDateTime(selectedEmployee.created_at)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Last Updated</Label>
                                                <p className="text-sm mt-1">{formatDateTime(selectedEmployee.updated_at)}</p>
                                            </div> */}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Employment Status */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Employment Status</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="flex items-center space-x-3 p-3 border rounded-lg">
                                                <div className={`h-3 w-3 rounded-full ${selectedEmployee.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                <div>
                                                    <Label className="text-sm">Active Status</Label>
                                                    <p className="text-sm mt-1">{selectedEmployee.is_active ? 'Active' : 'Inactive'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3 p-3 border rounded-lg">
                                                <div className={`h-3 w-3 rounded-full ${selectedEmployee.is_interviewer ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                                <div>
                                                    <Label className="text-sm">Interviewer</Label>
                                                    <p className="text-sm mt-1">{selectedEmployee.is_interviewer ? 'Yes' : 'No'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3 p-3 border rounded-lg">
                                                <div className={`h-3 w-3 rounded-full ${selectedEmployee.is_archived ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                                                <div>
                                                    <Label className="text-sm">Archived</Label>
                                                    <p className="text-sm mt-1">{selectedEmployee.is_archived ? 'Yes' : 'No'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Benefits Tab */}
                            <TabsContent value="benefits" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Employee Benefits</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {selectedEmployee.benefits && selectedEmployee.benefits.length > 0 ? (
                                            <div className="space-y-3">
                                                {selectedEmployee.benefits.map((benefit) => (
                                                    <div key={benefit.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                                            <div>
                                                                <p className="font-medium text-sm">{benefit.benefit_name}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {benefit.category} • Rate: {benefit.rate}
                                                                </p>
                                                                {benefit.description && (
                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                        {benefit.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                                            Active
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <FileCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                                <p>No benefits assigned</p>
                                                <p className="text-sm">Benefits can be assigned in the edit view</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Allowances Tab */}
                            <TabsContent value="allowances" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Employee Allowances</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {selectedEmployee.allowances && selectedEmployee.allowances.length > 0 ? (
                                            <div className="space-y-3">
                                                {selectedEmployee.allowances.map((allowance) => (
                                                    <div key={allowance.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                                            <div>
                                                                <p className="font-medium text-sm">{allowance.type_name}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Type: Allowance
                                                                </p>
                                                                {allowance.amount && (
                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                        Amount: {allowance.amount}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline" className="bg-green-50 text-green-700">
                                                            Active
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <PhilippinePeso className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                                <p>No allowances assigned</p>
                                                <p className="text-sm">Allowances can be assigned in the edit view</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Files Tab */}
                            <TabsContent value="files" className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Resume */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Resume</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {selectedEmployee.resume ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm font-medium">Resume File</span>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => downloadFile(selectedEmployee.resume!, 'Resume.pdf')}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                        Download Resume
                                                    </Button>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">No resume uploaded</p>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* 201 Files */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>201 Files</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {selectedEmployee.files && selectedEmployee.files.length > 0 ? (
                                                <div className="space-y-3">
                                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                                        {selectedEmployee.files.map((file: any) => (
                                                            <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                                <div className="flex items-center space-x-2">
                                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                                    <span className="text-sm font-medium">{file.file_name}</span>
                                                                </div>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => downloadFile(file.file_path, file.file_name)}
                                                                >
                                                                    <Download className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">No 201 files uploaded</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                            Close
                        </Button>
                        <Button onClick={() => {
                            setEditingEmployee(selectedEmployee);
                            setIsViewDialogOpen(false);
                        }}>
                            Edit Employee
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default Employees;