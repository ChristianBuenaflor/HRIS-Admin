import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Calendar, Save, Download, Pencil, X } from 'lucide-react';
import type { StepComponentProps } from '../setupManagerTypes'
import { toast } from 'sonner';
import api from '@/utils/axios';

// Backend interface to match Laravel API response
interface BackendLeaveType {
    id: number;
    leave_name: string;
    description: string;
    max_days: number;
    is_paid: boolean;
    is_active: boolean;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
    assigned_employees?: AssignedEmployee[];
}

interface LeaveTypesResponse {
    isSuccess: boolean;
    leave_types: BackendLeaveType[];
    pagination?: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
}

interface CreateLeaveTypeResponse {
    isSuccess: boolean;
    message: string;
    leave_type: BackendLeaveType;
    assigned_employees?: AssignedEmployee[];
    assignment_count?: number;
}

interface AssignedEmployee {
    id: number;
    employee_id: number;
    leave_type_id: number;
    allocated_days: number;
    used_days: number;
    remaining_days: number;
    is_active: boolean;
    is_archived: boolean;
}

interface EmployeeDropdownOption {
    id: number;
    name: string;
}

interface EmployeeDropdownResponse {
    isSuccess: boolean;
    message?: string;
    data: EmployeeDropdownOption[];
}

interface ApiErrorResponse {
    message?: string;
    error?: string;
    errors?: Record<string, string[] | string>;
}

type LeaveTypeForm = {
    name: string;
    maxDays: number;
    isPaid: boolean;
    description: string;
    requiresApproval: boolean;
    employeeIds: number[];
    isActive: boolean;
};

const emptyLeaveTypeForm: LeaveTypeForm = {
    name: '',
    maxDays: 0,
    isPaid: true,
    description: '',
    requiresApproval: true,
    employeeIds: [],
    isActive: true
};

export const LeaveTypesStep: React.FC<StepComponentProps> = ({ setupData, setSetupData }) => {
    const [newLeave, setNewLeave] = useState<LeaveTypeForm>(emptyLeaveTypeForm);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [backendLeaveTypes, setBackendLeaveTypes] = useState<BackendLeaveType[]>([]);
    const [editingLeaveTypeId, setEditingLeaveTypeId] = useState<number | null>(null);
    const [employees, setEmployees] = useState<EmployeeDropdownOption[]>([]);
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
    const [assignedEmployeeIds, setAssignedEmployeeIds] = useState<Record<number, number[]>>({});

    // Convert backend data to frontend format
    const backendToFrontendFormat = (backendData: BackendLeaveType[]) => {
        return backendData.map(leaveType => ({
            id: leaveType.id.toString(),
            name: leaveType.leave_name,
            defaultDays: leaveType.max_days,
            requiresApproval: true, // Default since backend doesn't have this field
            description: leaveType.description || '',
            isPaid: leaveType.is_paid,
        }));
    };

    // Convert frontend data to backend format
    const frontendToBackendFormat = (frontendData: {
        name: string;
        maxDays: number;
        isPaid: boolean;
        description: string;
        isActive: boolean;
        employeeIds: number[];
    }) => {
        return {
            leave_name: frontendData.name,
            max_days: frontendData.maxDays,
            is_paid: frontendData.isPaid,
            description: frontendData.description,
            is_active: frontendData.isActive,
            employees: frontendData.employeeIds.map((employeeId) => ({
                employee_id: employeeId,
                allocated_days: frontendData.maxDays,
            })),
        };
    };

    const loadEmployees = async () => {
        try {
            setIsLoadingEmployees(true);
            const response = await api.get('/dropdown/employees');
            const result: EmployeeDropdownResponse = response.data;

            if (result.isSuccess) {
                setEmployees(result.data || []);
            } else {
                toast.error(result.message || 'Failed to load employees');
            }
        } catch (error: any) {
            console.error('Failed to load employees:', error);
            toast.error(error.response?.data?.message || 'Failed to load employees');
        } finally {
            setIsLoadingEmployees(false);
        }
    };

    // Load leave types from backend
    const loadLeaveTypes = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/leave-types');
            const result: LeaveTypesResponse = response.data;

            if (result.isSuccess && result.leave_types) {
                setBackendLeaveTypes(result.leave_types);
                setAssignedEmployeeIds((currentAssignments) => {
                    const loadedAssignments = result.leave_types.reduce<Record<number, number[]>>(
                        (assignments, leaveType) => {
                            if (leaveType.assigned_employees) {
                                assignments[leaveType.id] = leaveType.assigned_employees.map(
                                    (assignment) => assignment.employee_id
                                );
                            }
                            return assignments;
                        },
                        {},
                    );

                    return { ...currentAssignments, ...loadedAssignments };
                });

                // Also update setupData with the loaded leave types
                const frontendData = backendToFrontendFormat(result.leave_types);
                setSetupData({
                    ...setupData,
                    leaveTypes: frontendData
                });

            } else {
                setBackendLeaveTypes([]);
            }

            return result.leave_types;
        } catch (error: any) {
            console.error('Failed to load leave types:', error);

            // Don't show error if it's 404 (no data yet)
            if (error.response?.status !== 404) {
                toast.error('Failed to load leave types');
            }

            setBackendLeaveTypes([]);

            return [];
        } finally {
            setIsLoading(false);
        }
    };

    // Add leave type to backend
    const addLeaveType = async () => {
        if (!newLeave.name.trim()) {
            toast.error('Please enter a leave type name');
            return;
        }

        if (newLeave.maxDays <= 0) {
            toast.error('Please enter a valid number of days (minimum 1)');
            return;
        }

        try {
            setIsSaving(true);
            const backendData = frontendToBackendFormat(newLeave);

            const response = editingLeaveTypeId === null
                ? await api.post('/create/leave-types', backendData)
                : await api.post(`/update/leave-types/${editingLeaveTypeId}`, {
                    leave_name: backendData.leave_name,
                    max_days: backendData.max_days,
                    is_paid: backendData.is_paid,
                    description: backendData.description,
                    is_active: backendData.is_active,
                    ...(backendData.employees.length > 0 && {
                        employees: backendData.employees,
                    }),
                });
            const result: CreateLeaveTypeResponse = response.data;

            if (result.isSuccess) {
                if (result.assigned_employees) {
                    setAssignedEmployeeIds((currentAssignments) => ({
                        ...currentAssignments,
                        [result.leave_type.id]: result.assigned_employees!.map(
                            (assignment) => assignment.employee_id
                        ),
                    }));
                }

                const assignmentMessage = editingLeaveTypeId === null && result.assignment_count
                    ? ` ${result.assignment_count} employee${result.assignment_count === 1 ? '' : 's'} assigned.`
                    : '';
                toast.success(editingLeaveTypeId === null
                    ? `Leave type created successfully.${assignmentMessage}`
                    : 'Leave type updated successfully');

                // Clear the form
                setNewLeave(emptyLeaveTypeForm);
                setEditingLeaveTypeId(null);

                // Reload leave types from backend to get the updated list
                await loadLeaveTypes();

                return result;
            } else {
                throw new Error(result.message || 'Failed to create leave type');
            }
        } catch (error: any) {
            console.error('Failed to create leave type:', error);

            const data = error.response?.data as ApiErrorResponse | undefined;
            if (error.response?.status === 422 || data?.errors) {
                const validationMessages = Object.entries(data?.errors || {})
                    .flatMap(([field, messages]) => {
                        const values = Array.isArray(messages) ? messages : [messages];
                        return values.map((message) => `${field}: ${message}`);
                    });

                toast.error(validationMessages.join(' ') || data?.message || 'Validation error occurred');
            } else {
                const errorMessage = data?.message || data?.error || 'Failed to create leave type';
                toast.error(errorMessage);
            }

            throw error;
        } finally {
            setIsSaving(false);
        }
    };

    const editLeaveType = (leaveType: BackendLeaveType) => {
        setEditingLeaveTypeId(leaveType.id);
        setNewLeave({
            name: leaveType.leave_name,
            maxDays: leaveType.max_days,
            isPaid: leaveType.is_paid,
            description: leaveType.description || '',
            requiresApproval: true,
            employeeIds: assignedEmployeeIds[leaveType.id]
                || leaveType.assigned_employees?.map((assignment) => assignment.employee_id)
                || [],
            isActive: leaveType.is_active
        });
    };

    const cancelEditing = () => {
        setEditingLeaveTypeId(null);
        setNewLeave(emptyLeaveTypeForm);
    };

    // Archive leave type in backend
    const removeLeaveType = async (id: string) => {
        if (!confirm('Are you sure you want to archive this leave type?')) {
            return;
        }

        try {
            const response = await api.post(`/leave-types/${id}/archive`);

            if (response.data.isSuccess) {
                toast.success('Leave type archived successfully');

                // Reload leave types from backend to get the updated list
                await loadLeaveTypes();
            } else {
                throw new Error('Failed to archive leave type');
            }
        } catch (error: any) {
            console.error('Failed to archive leave type:', error);
            const errorMessage = error.response?.data?.message || 'Failed to archive leave type';
            toast.error(errorMessage);
        }
    };

    // Add leave type to local state only (for setup wizard)
    const addLeaveTypeToLocal = () => {
        if (newLeave.name && newLeave.maxDays > 0) {
            setSetupData({
                ...setupData,
                leaveTypes: [
                    ...setupData.leaveTypes,
                    {
                        id: Date.now().toString(),
                        name: newLeave.name,
                        defaultDays: newLeave.maxDays,
                        requiresApproval: newLeave.requiresApproval,
                        description: newLeave.description,
                        isPaid: newLeave.isPaid,
                        isActive: newLeave.isActive
                    }
                ]
            });
            setNewLeave({
                name: '',
                maxDays: 0,
                isPaid: true,
                description: '',
                requiresApproval: true,
                employeeIds: [],
                isActive: true
            });
            toast.success('Leave type added to setup (will be saved later)');
        }
    };

    // Remove leave type from local state only
    const removeLeaveTypeFromLocal = (id: string) => {
        setSetupData({
            ...setupData,
            leaveTypes: setupData.leaveTypes.filter(l => l.id !== id)
        });
    };

    const toggleEmployee = (employeeId: number, checked: boolean) => {
        setNewLeave({
            ...newLeave,
            employeeIds: checked
                ? [...newLeave.employeeIds, employeeId]
                : newLeave.employeeIds.filter(id => id !== employeeId)
        });
    };

    // Load leave types when component mounts
    useEffect(() => {
        loadLeaveTypes();
        loadEmployees();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Leave Types
                </CardTitle>
                <CardDescription>
                    Configure leave types and their allocations. Manage leave types directly in your backend system.
                </CardDescription>

                {/* Backend Actions */}
                <div className="flex gap-2 mt-4">
                    <Button
                        onClick={loadLeaveTypes}
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {isLoading ? 'Loading...' : 'Refresh from Server'}
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Add Leave Type Form */}
                <div className="p-4 border rounded-lg space-y-3 bg-slate-50">
                    <h4 className="font-medium">
                        {editingLeaveTypeId === null ? 'Add New Leave Type' : 'Edit Leave Type'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <Input
                            placeholder="Leave type name"
                            value={newLeave.name}
                            onChange={(e) => setNewLeave({ ...newLeave, name: e.target.value })}
                        />
                        <Input
                            type="number"
                            placeholder="Max days"
                            min="1"
                            value={newLeave.maxDays || ''}
                            onChange={(e) => setNewLeave({ ...newLeave, maxDays: Number(e.target.value) })}
                        />
                        <Select
                            value={newLeave.isPaid.toString()}
                            onValueChange={(value) => setNewLeave({ ...newLeave, isPaid: value === 'true' })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Payment Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true">Paid Leave</SelectItem>
                                <SelectItem value="false">Unpaid Leave</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={newLeave.requiresApproval.toString()}
                            onValueChange={(value) => setNewLeave({ ...newLeave, requiresApproval: value === 'true' })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Approval Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true">Requires Approval</SelectItem>
                                <SelectItem value="false">Auto-Approved</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-1">
                        <Input
                            placeholder="Description (optional)"
                            value={newLeave.description}
                            onChange={(e) => setNewLeave({ ...newLeave, description: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Assign to Employees (optional)</Label>
                        <div className="max-h-48 overflow-y-auto rounded-md border bg-white p-3">
                            {isLoadingEmployees ? (
                                <p className="text-sm text-muted-foreground">Loading employees...</p>
                            ) : employees.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No employees available.</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                    {employees.map((employee) => (
                                        <label key={employee.id} className="flex items-center gap-2 text-sm">
                                            <Checkbox
                                                checked={newLeave.employeeIds.includes(employee.id)}
                                                onCheckedChange={(checked) => toggleEmployee(employee.id, checked === true)}
                                            />
                                            <span>{employee.name}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Selected employees will be assigned this leave type with the configured maximum days when saved to the server.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Switch
                            id="leave-type-active"
                            checked={newLeave.isActive}
                            onCheckedChange={(checked) => setNewLeave({ ...newLeave, isActive: checked })}
                        />
                        <Label htmlFor="leave-type-active">
                            {newLeave.isActive ? 'Active leave type' : 'Inactive leave type'}
                        </Label>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={addLeaveType}
                            size="sm"
                            disabled={isSaving}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? 'Saving...' : editingLeaveTypeId === null ? 'Save to Server' : 'Update on Server'}
                        </Button>

                        {editingLeaveTypeId !== null && (
                            <Button onClick={cancelEditing} variant="ghost" size="sm" disabled={isSaving}>
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                        )}

                        {editingLeaveTypeId === null && (
                            <Button onClick={addLeaveTypeToLocal} variant="outline" size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Add to Setup Only
                            </Button>
                        )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                        "Save to Server" will create the leave type in your database. "Add to Setup Only" will only add it to the current setup session.
                    </p>
                </div>

                {/* Server Leave Types List */}
                {backendLeaveTypes.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="font-medium text-lg">Leave Types from Server</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Leave Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Max Days</TableHead>
                                    <TableHead>Payment</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-20">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {backendLeaveTypes.map((leaveType) => (
                                    <TableRow key={leaveType.id}>
                                        <TableCell className="font-medium">{leaveType.leave_name}</TableCell>
                                        <TableCell className="max-w-xs truncate">
                                            {leaveType.description || 'No description'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{leaveType.max_days} days</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={leaveType.is_paid ? "default" : "secondary"}>
                                                {leaveType.is_paid ? 'Paid' : 'Unpaid'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${leaveType.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {leaveType.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => editLeaveType(leaveType)}
                                                title="Edit Leave Type"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeLeaveType(leaveType.id.toString())}
                                                title="Archive Leave Type"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Local Setup Leave Types List */}
                {setupData.leaveTypes.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="font-medium text-lg">Leave Types in Current Setup</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Leave Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Default Days</TableHead>
                                    <TableHead>Payment</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Approval</TableHead>
                                    <TableHead className="w-20">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {setupData.leaveTypes.map((leave) => (
                                    <TableRow key={leave.id}>
                                        <TableCell className="font-medium">{leave.name}</TableCell>
                                        <TableCell className="max-w-xs truncate">
                                            {leave.description || 'No description'}
                                        </TableCell>
                                        <TableCell>{leave.defaultDays} days</TableCell>
                                        <TableCell>
                                            <Badge variant={leave.isPaid ? "default" : "secondary"}>
                                                {leave.isPaid ? 'Paid' : 'Unpaid'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={leave.isActive ? "default" : "secondary"}>
                                                {leave.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={leave.requiresApproval ? "default" : "secondary"}>
                                                {leave.requiresApproval ? 'Required' : 'Auto'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeLeaveTypeFromLocal(leave.id)}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {backendLeaveTypes.length === 0 && setupData.leaveTypes.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        No leave types found. Add your first leave type above.
                    </div>
                )}

                {/* Information Notice */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center text-sm text-blue-800">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Leave types are managed in your backend system. Use "Save to Server" to create permanent leave types.
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};