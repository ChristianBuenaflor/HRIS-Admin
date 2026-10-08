import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { userService } from '@/features/settings/userService';
import type { User, UserFormData, PaginationParams } from '@/features/settings/userService';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner"; // Correct import
import {
    Settings,
    Shield,
    Users,
    Database,
    Bell,
    Clock,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Save,
    UserPlus,
    Edit,
    Trash2,
    Mail,
    Plus,
    Building,
    Search,
    Filter,
    Eye
} from 'lucide-react';

const SettingsComponent = () => {
    // REMOVE this line: const { toast } = toast(); // ❌ WRONG
    // Sonner toast is imported directly, not destructured

    const [settings, setSettings] = useState({
        // General Settings - Company Information
        companyName: 'Acme Corporation',
        companyMission: 'To empower businesses with innovative technology solutions that drive growth and success.',
        companyVision: 'To be the leading provider of enterprise solutions, transforming how organizations operate and grow in the digital age.',
        registrationNumber: 'REG-2024-12345',
        taxId: '12-3456789',
        foundedYear: '2010',
        industry: 'Technology',
        companySize: '100-500',
        website: 'www.acmecorp.com',
        primaryEmail: 'info@acmecorp.com',
        phoneNumber: '+1 (555) 123-4567',
        address: '123 Business Street',
        city: 'San Francisco',
        state: 'California',
        postalCode: '94102',
        country: 'United States',

        // Security Settings
        passwordPolicy: 'medium',
        sessionTimeout: '8',
        twoFactorAuth: true,
        auditLogging: true,

        // HR Policies
        workingHours: '8',
        lunchBreak: '1',
        overtimeRate: '1.5',
        probationPeriod: '90',

        // Leave Policies
        annualLeave: '20',
        sickLeave: '10',
        maternityLeave: '12',
        paternityLeave: '2',

        // Attendance Settings
        lateThreshold: '15',
        halfDayThreshold: '4',
        attendanceTracking: true,
        geofencing: false,

        // Notification Settings
        emailNotifications: true,
        payrollReminders: true,
        leaveApprovals: true,
        birthdayReminders: true,
    });

    const [hasChanges, setHasChanges] = useState(false);
    const SETTINGS_STORAGE_KEY = "hris-admin-settings";

    // User Management State
    const [users, setUsers] = useState<User[]>([]);
    const [userLoading, setUserLoading] = useState(true);
    const [userError, setUserError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        role_id: ''
    });
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1
    });
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showUserDialog, setShowUserDialog] = useState(false);
    const [userForm, setUserForm] = useState<UserFormData>({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        password: '',
        profile_picture: null,
        role_id: 2,
        status: 'Active'
    });
    const [profilePreview, setProfilePreview] = useState<string | null>(null);

    // Department Management State
    const [departments, setDepartments] = useState([
        { id: 'D001', name: 'Engineering', manager: 'Sarah Johnson', employeeCount: 12, description: 'Software development and technical operations' },
        { id: 'D002', name: 'Marketing', manager: 'Michael Brown', employeeCount: 8, description: 'Brand management and customer engagement' },
        { id: 'D003', name: 'Sales', manager: 'Lisa Davis', employeeCount: 15, description: 'Revenue generation and client relations' },
        { id: 'D004', name: 'Human Resources', manager: 'David Miller', employeeCount: 4, description: 'Employee management and organizational development' },
        { id: 'D005', name: 'Finance', manager: 'Emily Wilson', employeeCount: 6, description: 'Financial planning and accounting' }
    ]);
    const [showDepartmentDialog, setShowDepartmentDialog] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<any>(null);
    const [departmentForm, setDepartmentForm] = useState({
        name: '',
        manager: '',
        employeeCount: '',
        description: ''
    });

    // User Management Functions
    const fetchUsers = async (page = 1, search = searchTerm, filterParams = filters) => {
        try {
            setUserLoading(true);
            setUserError(null);

            const params: PaginationParams = {
                page,
                per_page: pagination.per_page,
                ...(search && { search }),
                ...(filterParams.status && { status: filterParams.status }),
                ...(filterParams.role_id && { role_id: parseInt(filterParams.role_id) }),
            };

            const response = await userService.getAllUsers(params);

            if (response.isSuccess) {
                setUsers(response.users);
                setPagination(response.pagination);
            } else {
                throw new Error(response.message || 'Failed to fetch users');
            }
        } catch (err) {
            setUserError(err instanceof Error ? err.message : 'An error occurred');
            toast.error(err instanceof Error ? err.message : 'An error occurred'); // ✅ CORRECT
        } finally {
            setUserLoading(false);
        }
    };

    // Search handler
    const handleSearch = (value: string) => {
        setSearchTerm(value);
        fetchUsers(1, value, filters);
    };

    // Filter handlers
    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        fetchUsers(1, searchTerm, newFilters);
    };

    // Create user
    const handleCreateUser = async (userData: UserFormData) => {
        try {
            setUserLoading(true);
            setUserError(null);
            const response = await userService.createUser(userData);

            if (response.isSuccess) {
                toast.success("User created successfully!"); // ✅ CORRECT
                await fetchUsers(pagination.current_page, searchTerm, filters);
                setShowUserDialog(false);
                resetUserForm();
            } else {
                const errorMsg = response.message || 'Failed to create user';
                setUserError(errorMsg);
                toast.error(errorMsg); // ✅ CORRECT
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to create user';
            setUserError(errorMsg);
            toast.error(errorMsg); // ✅ CORRECT
        } finally {
            setUserLoading(false);
        }
    };

    // Update user
    const handleUpdateUser = async (id: number, userData: Partial<UserFormData>) => {
        try {
            setUserLoading(true);
            setUserError(null);
            const response = await userService.updateUser(id, userData);

            if (response.isSuccess) {
                toast.success("User updated successfully!"); // ✅ CORRECT
                await fetchUsers(pagination.current_page, searchTerm, filters);
                setShowUserDialog(false);
                resetUserForm();
                setEditingUser(null);
            } else {
                const errorMsg = response.message || 'Failed to update user';
                setUserError(errorMsg);
                toast.error(errorMsg); // ✅ CORRECT
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to update user';
            setUserError(errorMsg);
            toast.error(errorMsg); // ✅ CORRECT
        } finally {
            setUserLoading(false);
        }
    };

    // Archive user
    const handleArchiveUser = async (id: number) => {
        if (window.confirm('Are you sure you want to archive this user?')) {
            try {
                setUserLoading(true);
                setUserError(null);
                const response = await userService.archiveUser(id);

                if (response.isSuccess) {
                    toast.success("User archived successfully!"); // ✅ CORRECT
                    await fetchUsers(pagination.current_page, searchTerm, filters);
                } else {
                    const errorMsg = response.message || 'Failed to archive user';
                    setUserError(errorMsg);
                    toast.error(errorMsg); // ✅ CORRECT
                }
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Failed to archive user';
                setUserError(errorMsg);
                toast.error(errorMsg); // ✅ CORRECT
            } finally {
                setUserLoading(false);
            }
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchUsers();
        try {
            const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.settings) setSettings((prev) => ({ ...prev, ...parsed.settings }));
                if (Array.isArray(parsed?.departments) && parsed.departments.length > 0) setDepartments(parsed.departments);
            }
        } catch {
            // keep built-in defaults when persisted snapshot is unreadable
        }
    }, []);

    // Reset user form
    const resetUserForm = () => {
        setUserForm({
            first_name: '',
            last_name: '',
            username: '',
            email: '',
            password: '',
            profile_picture: null,
            role_id: 2,
            status: 'Active'
        });
        setProfilePreview(null);
        setEditingUser(null);
    };

    // Handle edit user
    const handleEditUser = (user: User) => {
        setUserForm({
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            email: user.email,
            password: '',
            profile_picture: null,
            role_id: user.role_id,
            status: user.status
        });

        if (user.profile_picture) {
            setProfilePreview(user.profile_picture);
        }

        setEditingUser(user);
        setShowUserDialog(true);
    };

    // Handle profile picture change
    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUserForm(prev => ({ ...prev, profile_picture: file }));

            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Save user (create or update)
    const handleSaveUser = () => {
        if (editingUser) {
            handleUpdateUser(editingUser.id, userForm);
        } else {
            handleCreateUser(userForm);
        }
    };

    // Settings functions
    const updateSetting = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const saveSettings = () => {
        try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ settings, departments, updatedAt: new Date().toISOString() }));
            setHasChanges(false);
            toast.success("Settings saved successfully!");
        } catch {
            toast.error("Failed to persist settings locally.");
        }
    };

    const resetToDefaults = () => {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            try {
                localStorage.removeItem(SETTINGS_STORAGE_KEY);
            } catch {
                // ignore storage failures
            }
            window.location.reload();
        }
    };

    // Department Management Functions
    const resetDepartmentForm = () => {
        setDepartmentForm({
            name: '',
            manager: '',
            employeeCount: '',
            description: ''
        });
        setEditingDepartment(null);
    };

    const handleSaveDepartment = () => {
        let nextDepartments;
        if (editingDepartment) {
            nextDepartments = departments.map(d =>
                d.id === editingDepartment.id
                    ? { ...d, name: departmentForm.name, manager: departmentForm.manager, employeeCount: Number(departmentForm.employeeCount), description: departmentForm.description }
                    : d
            );
            setDepartments(nextDepartments);
        } else {
            const newDepartment = {
                id: `D${String(departments.length + 1).padStart(3, '0')}`,
                name: departmentForm.name,
                manager: departmentForm.manager,
                employeeCount: Number(departmentForm.employeeCount),
                description: departmentForm.description
            };
            nextDepartments = [...departments, newDepartment];
            setDepartments(nextDepartments);
        }
        try {
            const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
            const persisted = raw ? JSON.parse(raw) : {};
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ ...persisted, settings, departments: nextDepartments, updatedAt: new Date().toISOString() }));
            toast.success(editingDepartment ? "Department updated and saved locally!" : "Department created and saved locally!");
        } catch {
            toast.success(editingDepartment ? "Department updated (local save failed)!" : "Department created (local save failed)!");
        }
        setHasChanges(false);
        setShowDepartmentDialog(false);
        resetDepartmentForm();
    };

    const handleEditDepartment = (department: any) => {
        setDepartmentForm({
            name: department.name,
            manager: department.manager,
            employeeCount: String(department.employeeCount),
            description: department.description
        });
        setEditingDepartment(department);
        setShowDepartmentDialog(true);
    };

    const handleDeleteDepartment = (id: any) => {
        if (confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
            setDepartments(departments.filter(d => d.id !== id));
            toast.success("Department deleted successfully!"); // ✅ CORRECT
        }
    };

    // Utility functions
    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">System Settings</h1>
                    <p className="text-muted-foreground">
                        Configure system preferences and policies
                    </p>
                </div>
                {hasChanges && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={resetToDefaults}>
                            Reset to Defaults
                        </Button>
                        <Button onClick={saveSettings}>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                )}
            </div>

            {hasChanges && (
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        You have unsaved changes. Make sure to save your settings before leaving this page.
                    </AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="grid w-full grid-cols-7">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="users">User Management</TabsTrigger>
                    <TabsTrigger value="hr-policies">HR Policies</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="integrations">Integrations</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="w-5 h-5" />
                                General Settings
                            </CardTitle>
                            <CardDescription>
                                Basic system configuration and company information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Basic Company Information */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-medium mb-4">Basic Information</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="companyName">Company Name</Label>
                                            <Input
                                                id="companyName"
                                                value={settings.companyName}
                                                onChange={(e) => updateSetting('companyName', e.target.value)}
                                                placeholder="Enter your company name"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="industry">Industry</Label>
                                                <Select value={settings.industry} onValueChange={(value) => updateSetting('industry', value)}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Technology">Technology</SelectItem>
                                                        <SelectItem value="Finance">Finance</SelectItem>
                                                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                                                        <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                                                        <SelectItem value="Retail">Retail</SelectItem>
                                                        <SelectItem value="Education">Education</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="companySize">Company Size</Label>
                                                <Select value={settings.companySize} onValueChange={(value) => updateSetting('companySize', value)}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="1-10">1-10 employees</SelectItem>
                                                        <SelectItem value="11-50">11-50 employees</SelectItem>
                                                        <SelectItem value="51-100">51-100 employees</SelectItem>
                                                        <SelectItem value="100-500">100-500 employees</SelectItem>
                                                        <SelectItem value="500+">500+ employees</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="foundedYear">Founded Year</Label>
                                                <Input
                                                    id="foundedYear"
                                                    value={settings.foundedYear}
                                                    onChange={(e) => updateSetting('foundedYear', e.target.value)}
                                                    placeholder="e.g., 2010"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="website">Website</Label>
                                                <Input
                                                    id="website"
                                                    value={settings.website}
                                                    onChange={(e) => updateSetting('website', e.target.value)}
                                                    placeholder="www.yourcompany.com"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Mission & Vision */}
                                <div>
                                    <h3 className="font-medium mb-4">Mission & Vision</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="companyMission">Company Mission</Label>
                                            <Textarea
                                                id="companyMission"
                                                value={settings.companyMission}
                                                onChange={(e) => updateSetting('companyMission', e.target.value)}
                                                placeholder="Enter your company's mission statement..."
                                                rows={3}
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                Define your company's purpose and what you aim to achieve
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="companyVision">Company Vision</Label>
                                            <Textarea
                                                id="companyVision"
                                                value={settings.companyVision}
                                                onChange={(e) => updateSetting('companyVision', e.target.value)}
                                                placeholder="Enter your company's vision statement..."
                                                rows={3}
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                Describe your company's long-term aspirations and goals
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Legal Information */}
                                <div>
                                    <h3 className="font-medium mb-4">Legal Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="registrationNumber">Registration Number</Label>
                                            <Input
                                                id="registrationNumber"
                                                value={settings.registrationNumber}
                                                onChange={(e) => updateSetting('registrationNumber', e.target.value)}
                                                placeholder="REG-2024-12345"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="taxId">Tax ID / EIN</Label>
                                            <Input
                                                id="taxId"
                                                value={settings.taxId}
                                                onChange={(e) => updateSetting('taxId', e.target.value)}
                                                placeholder="12-3456789"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Contact Information */}
                                <div>
                                    <h3 className="font-medium mb-4">Contact Information</h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="primaryEmail">Primary Email</Label>
                                                <Input
                                                    id="primaryEmail"
                                                    type="email"
                                                    value={settings.primaryEmail}
                                                    onChange={(e) => updateSetting('primaryEmail', e.target.value)}
                                                    placeholder="info@company.com"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="phoneNumber">Phone Number</Label>
                                                <Input
                                                    id="phoneNumber"
                                                    value={settings.phoneNumber}
                                                    onChange={(e) => updateSetting('phoneNumber', e.target.value)}
                                                    placeholder="+1 (555) 123-4567"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="address">Street Address</Label>
                                            <Input
                                                id="address"
                                                value={settings.address}
                                                onChange={(e) => updateSetting('address', e.target.value)}
                                                placeholder="123 Business Street"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="city">City</Label>
                                                <Input
                                                    id="city"
                                                    value={settings.city}
                                                    onChange={(e) => updateSetting('city', e.target.value)}
                                                    placeholder="San Francisco"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="state">State / Province</Label>
                                                <Input
                                                    id="state"
                                                    value={settings.state}
                                                    onChange={(e) => updateSetting('state', e.target.value)}
                                                    placeholder="California"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="postalCode">Postal Code</Label>
                                                <Input
                                                    id="postalCode"
                                                    value={settings.postalCode}
                                                    onChange={(e) => updateSetting('postalCode', e.target.value)}
                                                    placeholder="94102"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="country">Country</Label>
                                                <Input
                                                    id="country"
                                                    value={settings.country}
                                                    onChange={(e) => updateSetting('country', e.target.value)}
                                                    placeholder="United States"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Departments */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-medium">Departments</h3>
                                        <Button onClick={() => {
                                            resetDepartmentForm();
                                            setShowDepartmentDialog(true);
                                        }}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Department
                                        </Button>
                                    </div>

                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Department Name</TableHead>
                                                    <TableHead>Manager</TableHead>
                                                    <TableHead>Employees</TableHead>
                                                    <TableHead>Description</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {departments.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                            No departments added yet. Click "Add Department" to create one.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    departments.map((dept) => (
                                                        <TableRow key={dept.id}>
                                                            <TableCell className="font-medium">{dept.name}</TableCell>
                                                            <TableCell>{dept.manager}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="secondary">{dept.employeeCount}</Badge>
                                                            </TableCell>
                                                            <TableCell className="max-w-xs truncate">{dept.description}</TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleEditDepartment(dept)}
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleDeleteDepartment(dept.id)}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Security Settings
                            </CardTitle>
                            <CardDescription>
                                Configure security policies and access controls
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="passwordPolicy">Password Policy</Label>
                                        <Select value={settings.passwordPolicy} onValueChange={(value) => updateSetting('passwordPolicy', value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low - 6 characters minimum</SelectItem>
                                                <SelectItem value="medium">Medium - 8 characters, mixed case</SelectItem>
                                                <SelectItem value="high">High - 12 characters, special chars</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                                        <Input
                                            id="sessionTimeout"
                                            type="number"
                                            value={settings.sessionTimeout}
                                            onChange={(e) => updateSetting('sessionTimeout', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Two-Factor Authentication</Label>
                                            <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                                        </div>
                                        <Switch
                                            checked={settings.twoFactorAuth}
                                            onCheckedChange={(checked) => updateSetting('twoFactorAuth', checked)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Audit Logging</Label>
                                            <p className="text-sm text-muted-foreground">Log all system activities</p>
                                        </div>
                                        <Switch
                                            checked={settings.auditLogging}
                                            onCheckedChange={(checked) => updateSetting('auditLogging', checked)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="users">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="w-5 h-5" />
                                        User Management
                                    </CardTitle>
                                    <CardDescription>
                                        Manage system administrators and their access levels
                                    </CardDescription>
                                </div>
                                <div className="flex items-center space-x-2 w-full sm:w-auto">
                                    <div className="relative flex-1 sm:flex-initial">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search users..."
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
                                        {(filters.status || filters.role_id) && (
                                            <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                                                Active
                                            </Badge>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            resetUserForm();
                                            setShowUserDialog(true);
                                        }}
                                        disabled={userLoading}
                                        className="flex items-center gap-2"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        Add User
                                    </Button>
                                </div>
                            </div>

                            {/* Filter Section */}
                            {isFilterOpen && (
                                <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="status-filter">Status</Label>
                                            <Select
                                                value={filters.status}
                                                onValueChange={(value) => handleFilterChange('status', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="All Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Status</SelectItem>
                                                    <SelectItem value="Active">Active</SelectItem>
                                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                                    <SelectItem value="Suspended">Suspended</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="role-filter">Role</Label>
                                            <Select
                                                value={filters.role_id}
                                                onValueChange={(value) => handleFilterChange('role_id', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="All Roles" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Roles</SelectItem>
                                                    <SelectItem value="1">Super Admin</SelectItem>
                                                    <SelectItem value="2">Admin</SelectItem>
                                                    <SelectItem value="3">HR Manager</SelectItem>
                                                    <SelectItem value="4">Manager</SelectItem>
                                                    <SelectItem value="5">Employee</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {(filters.status || filters.role_id) && (
                                        <div className="mt-4 flex justify-end">
                                            <Button variant="outline" size="sm" onClick={() => {
                                                setFilters({ status: '', role_id: '' });
                                                fetchUsers(1, searchTerm, { status: '', role_id: '' });
                                            }}>
                                                Clear Filters
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardHeader>
                        <CardContent>
                            <Alert className="mb-6">
                                <Shield className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>Important:</strong> Super Admin has full system access. Admin can manage employees, payroll, and attendance but cannot modify system settings.
                                </AlertDescription>
                            </Alert>

                            {/* Error Alert */}
                            {userError && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        {userError}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Loading State */}
                            {userLoading && users.length === 0 ? (
                                <div className="flex justify-center items-center h-40">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Profile</TableHead>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Username</TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>Role</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Created At</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {users.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                            {userLoading ? 'Loading users...' : 'No users found'}
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    users.map((user) => (
                                                        <TableRow key={user.id} className="hover:bg-muted/50">
                                                            <TableCell>
                                                                <Avatar className="h-9 w-9">
                                                                    {user.profile_picture ? (
                                                                        <img
                                                                            src={user.profile_picture}
                                                                            alt={user.first_name}
                                                                            className="h-full w-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <AvatarFallback className="bg-primary/10 text-primary">
                                                                            {getInitials(user.first_name, user.last_name)}
                                                                        </AvatarFallback>
                                                                    )}
                                                                </Avatar>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="font-medium">
                                                                    {user.first_name} {user.last_name}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>{user.username}</TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                                                    {user.email}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant={
                                                                    Number(user.role_id) === 1 ? 'default' :
                                                                        Number(user.role_id) === 2 ? 'secondary' :
                                                                            'outline'
                                                                }>
                                                                    {user.role_name} {/* Directly from API */}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant={
                                                                    user.status === 'Active' ? 'default' :
                                                                        user.status === 'Inactive' ? 'secondary' : 'destructive'
                                                                }>
                                                                    {user.status}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-sm text-muted-foreground">
                                                                {formatDate(user.created_at)}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setSelectedUser(user);
                                                                            setIsViewDialogOpen(true);
                                                                        }}
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleEditUser(user)}
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <Button variant="ghost" size="sm">
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>Archive User</AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    Are you sure you want to archive "{user.first_name} {user.last_name}"?
                                                                                    This will disable their account but preserve their data.
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                <AlertDialogAction
                                                                                    onClick={() => handleArchiveUser(user.id)}
                                                                                    className="bg-red-600 hover:bg-red-700"
                                                                                >
                                                                                    Archive
                                                                                </AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
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
                                                        onChange={(e) => {
                                                            setPagination(prev => ({
                                                                ...prev,
                                                                per_page: parseInt(e.target.value),
                                                                current_page: 1
                                                            }));
                                                            fetchUsers(1, searchTerm, filters);
                                                        }}
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
                                                    onClick={() => {
                                                        setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }));
                                                        fetchUsers(pagination.current_page - 1, searchTerm, filters);
                                                    }}
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
                                                                onClick={() => {
                                                                    setPagination(prev => ({ ...prev, current_page: pageNum }));
                                                                    fetchUsers(pageNum, searchTerm, filters);
                                                                }}
                                                            >
                                                                {pageNum}
                                                            </Button>
                                                        );
                                                    })}
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }));
                                                        fetchUsers(pagination.current_page + 1, searchTerm, filters);
                                                    }}
                                                    disabled={pagination.current_page === pagination.last_page}
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Other tabs */}
                <TabsContent value="hr-policies">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    Working Hours & Overtime
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="workingHours">Daily Working Hours</Label>
                                        <Input
                                            id="workingHours"
                                            type="number"
                                            value={settings.workingHours}
                                            onChange={(e) => updateSetting('workingHours', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lunchBreak">Lunch Break (hours)</Label>
                                        <Input
                                            id="lunchBreak"
                                            type="number"
                                            step="0.5"
                                            value={settings.lunchBreak}
                                            onChange={(e) => updateSetting('lunchBreak', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="overtimeRate">Overtime Rate Multiplier</Label>
                                        <Input
                                            id="overtimeRate"
                                            type="number"
                                            step="0.1"
                                            value={settings.overtimeRate}
                                            onChange={(e) => updateSetting('overtimeRate', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    Leave Policies
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="annualLeave">Annual Leave (days)</Label>
                                        <Input
                                            id="annualLeave"
                                            type="number"
                                            value={settings.annualLeave}
                                            onChange={(e) => updateSetting('annualLeave', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sickLeave">Sick Leave (days)</Label>
                                        <Input
                                            id="sickLeave"
                                            type="number"
                                            value={settings.sickLeave}
                                            onChange={(e) => updateSetting('sickLeave', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="maternityLeave">Maternity Leave (weeks)</Label>
                                        <Input
                                            id="maternityLeave"
                                            type="number"
                                            value={settings.maternityLeave}
                                            onChange={(e) => updateSetting('maternityLeave', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="paternityLeave">Paternity Leave (weeks)</Label>
                                        <Input
                                            id="paternityLeave"
                                            type="number"
                                            value={settings.paternityLeave}
                                            onChange={(e) => updateSetting('paternityLeave', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="attendance">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Attendance Settings
                            </CardTitle>
                            <CardDescription>
                                Configure attendance tracking and policies
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="lateThreshold">Late Threshold (minutes)</Label>
                                        <Input
                                            id="lateThreshold"
                                            type="number"
                                            value={settings.lateThreshold}
                                            onChange={(e) => updateSetting('lateThreshold', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="halfDayThreshold">Half Day Threshold (hours)</Label>
                                        <Input
                                            id="halfDayThreshold"
                                            type="number"
                                            value={settings.halfDayThreshold}
                                            onChange={(e) => updateSetting('halfDayThreshold', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Attendance Tracking</Label>
                                            <p className="text-sm text-muted-foreground">Enable automatic attendance tracking</p>
                                        </div>
                                        <Switch
                                            checked={settings.attendanceTracking}
                                            onCheckedChange={(checked) => updateSetting('attendanceTracking', checked)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Geofencing</Label>
                                            <p className="text-sm text-muted-foreground">Restrict clock-in by location</p>
                                        </div>
                                        <Switch
                                            checked={settings.geofencing}
                                            onCheckedChange={(checked) => updateSetting('geofencing', checked)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="w-5 h-5" />
                                Notification Settings
                            </CardTitle>
                            <CardDescription>
                                Configure system notifications and reminders
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Email Notifications</Label>
                                        <p className="text-sm text-muted-foreground">Send email notifications for important events</p>
                                    </div>
                                    <Switch
                                        checked={settings.emailNotifications}
                                        onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                                    />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Payroll Reminders</Label>
                                        <p className="text-sm text-muted-foreground">Remind managers about payroll processing</p>
                                    </div>
                                    <Switch
                                        checked={settings.payrollReminders}
                                        onCheckedChange={(checked) => updateSetting('payrollReminders', checked)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Leave Approval Notifications</Label>
                                        <p className="text-sm text-muted-foreground">Notify managers of pending leave requests</p>
                                    </div>
                                    <Switch
                                        checked={settings.leaveApprovals}
                                        onCheckedChange={(checked) => updateSetting('leaveApprovals', checked)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Birthday Reminders</Label>
                                        <p className="text-sm text-muted-foreground">Send birthday notifications for employees</p>
                                    </div>
                                    <Switch
                                        checked={settings.birthdayReminders}
                                        onCheckedChange={(checked) => updateSetting('birthdayReminders', checked)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="integrations">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="w-5 h-5" />
                                System Integrations
                            </CardTitle>
                            <CardDescription>
                                Manage external system integrations and APIs
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-1">
                                        <div className="font-medium">Accounting System</div>
                                        <div className="text-sm text-muted-foreground">QuickBooks Integration</div>
                                    </div>
                                    <Badge variant="outline" className="bg-green-50 text-green-700">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Connected
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-1">
                                        <div className="font-medium">Time Tracking</div>
                                        <div className="text-sm text-muted-foreground">Biometric Clock System</div>
                                    </div>
                                    <Badge variant="outline" className="bg-green-50 text-green-700">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Connected
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-1">
                                        <div className="font-medium">Email Service</div>
                                        <div className="text-sm text-muted-foreground">SMTP Configuration</div>
                                    </div>
                                    <Badge variant="secondary">
                                        Not Configured
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-1">
                                        <div className="font-medium">Background Check</div>
                                        <div className="text-sm text-muted-foreground">Third-party verification service</div>
                                    </div>
                                    <Badge variant="secondary">
                                        Not Connected
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* User Dialog */}
            <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingUser ? 'Edit User' : 'Add New User'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingUser ? 'Update user information and access level' : 'Create a new system administrator account'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Profile Picture Upload */}
                        <div className="flex flex-col items-center space-y-4">
                            <div className="relative">
                                {profilePreview ? (
                                    <img
                                        src={profilePreview}
                                        alt="Profile preview"
                                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-white shadow-lg">
                                        <Users className="w-16 h-16 text-primary/50" />
                                    </div>
                                )}
                                <Label
                                    htmlFor="profile-picture"
                                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90"
                                >
                                    <Edit className="w-4 h-4" />
                                </Label>
                                <Input
                                    id="profile-picture"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleProfilePictureChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">First Name *</Label>
                                <Input
                                    id="first_name"
                                    value={userForm.first_name}
                                    onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                                    placeholder="John"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Last Name *</Label>
                                <Input
                                    id="last_name"
                                    value={userForm.last_name}
                                    onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                                    placeholder="Doe"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username *</Label>
                                <Input
                                    id="username"
                                    value={userForm.username}
                                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                                    placeholder="johndoe"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={userForm.email}
                                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                    placeholder="john@company.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">
                                {editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={userForm.password}
                                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                placeholder={editingUser ? 'Enter new password...' : 'Enter password...'}
                                required={!editingUser}
                            />
                            <p className="text-xs text-muted-foreground">
                                Password must be at least 6 characters
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="role_id">Role *</Label>
                                <Select
                                    value={userForm.role_id.toString()}
                                    onValueChange={(value) => setUserForm({ ...userForm, role_id: parseInt(value) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Super Admin</SelectItem>
                                        <SelectItem value="2">Admin</SelectItem>
                                        <SelectItem value="3">HR Manager</SelectItem>
                                        <SelectItem value="4">Manager</SelectItem>
                                        <SelectItem value="5">Employee</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={userForm.status}
                                    onValueChange={(value) => setUserForm({ ...userForm, status: value as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                        <SelectItem value="Suspended">Suspended</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowUserDialog(false);
                                resetUserForm();
                            }}
                            disabled={userLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveUser}
                            disabled={userLoading ||
                                !userForm.first_name ||
                                !userForm.last_name ||
                                !userForm.username ||
                                !userForm.email ||
                                (!editingUser && !userForm.password)}
                        >
                            {userLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    {editingUser ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                editingUser ? 'Update User' : 'Create User'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* User View Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>User Details</DialogTitle>
                        <DialogDescription>
                            Complete information for {selectedUser?.first_name} {selectedUser?.last_name}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-6">
                            <div className="flex items-center space-x-4">
                                <Avatar className="h-20 w-20">
                                    {selectedUser.profile_picture ? (
                                        <img
                                            src={selectedUser.profile_picture}
                                            alt={selectedUser.first_name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <AvatarFallback className="text-lg bg-primary/10 text-primary">
                                            {getInitials(selectedUser.first_name, selectedUser.last_name)}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold">
                                        {selectedUser.first_name} {selectedUser.last_name}
                                    </h3>
                                    <p className="text-muted-foreground">{selectedUser.username}</p>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <Badge variant={
                                            selectedUser.status === 'Active' ? 'default' :
                                                selectedUser.status === 'Inactive' ? 'secondary' : 'destructive'
                                        }>
                                            {selectedUser.status}
                                        </Badge>
                                        <Badge variant="outline">
                                            {selectedUser.role_name} {/* Use role_name directly */}
                                        </Badge>
                                        {selectedUser.is_archived === 1 && (
                                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                                Archived
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Contact Information</h4>
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-sm font-medium">Email</p>
                                            <p className="text-sm">{selectedUser.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Account Information</h4>
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-sm font-medium">Username</p>
                                            <p className="text-sm">{selectedUser.username}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Created At</p>
                                            <p className="text-sm">{formatDate(selectedUser.created_at)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Last Updated</p>
                                            <p className="text-sm">{formatDate(selectedUser.updated_at)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                            Close
                        </Button>
                        <Button onClick={() => {
                            if (selectedUser) {
                                handleEditUser(selectedUser);
                                setIsViewDialogOpen(false);
                            }
                        }}>
                            Edit User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Department Dialog */}
            <Dialog open={showDepartmentDialog} onOpenChange={setShowDepartmentDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building className="w-5 h-5" />
                            {editingDepartment ? 'Edit Department' : 'Add New Department'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingDepartment ? 'Update department information' : 'Create a new department in your organization'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="deptName">Department Name</Label>
                            <Input
                                id="deptName"
                                value={departmentForm.name}
                                onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                                placeholder="e.g., Engineering, Marketing"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="deptManager">Department Manager</Label>
                            <Input
                                id="deptManager"
                                value={departmentForm.manager}
                                onChange={(e) => setDepartmentForm({ ...departmentForm, manager: e.target.value })}
                                placeholder="e.g., John Doe"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="deptEmployees">Number of Employees</Label>
                            <Input
                                id="deptEmployees"
                                type="number"
                                value={departmentForm.employeeCount}
                                onChange={(e) => setDepartmentForm({ ...departmentForm, employeeCount: e.target.value })}
                                placeholder="0"
                                min="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="deptDescription">Description</Label>
                            <Textarea
                                id="deptDescription"
                                value={departmentForm.description}
                                onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })}
                                placeholder="Brief description of the department's role and responsibilities"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowDepartmentDialog(false);
                            resetDepartmentForm();
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveDepartment}>
                            {editingDepartment ? 'Update Department' : 'Add Department'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default SettingsComponent;