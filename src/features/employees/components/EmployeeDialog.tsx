// EmployeeDialog.tsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FileText, User, Briefcase, GraduationCap, FileCheck, AlertCircle, MapPin, PhilippinePeso, Users } from "lucide-react";
import api from '@/utils/axios';
import { toast } from 'sonner';
import type { Employee, Department, PositionType, BenefitType, AllowanceType } from '../employeeTS';

interface EmployeeDialogProps {
    editingEmployee: Employee | null;
    setEditingEmployee: (employee: Employee | null) => void;
    departments: Department[];
    positions: PositionType[];
    benefitTypes: BenefitType[];
    onEmployeeAdded: () => void;
    onEmployeeUpdated: () => void;
    onEmployeeArchived: () => void;
}

// Education level component
const EducationLevel = ({
    level,
    prefix,
    formData,
    onInputChange
}: {
    level: string;
    prefix: string;
    formData: any;
    onInputChange: (field: string, value: any) => void;
}) => (
    <Card>
        <CardHeader>
            <CardTitle className="text-lg">{level} Education</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor={`${prefix}_school_name`}>School Name</Label>
                <Input
                    id={`${prefix}_school_name`}
                    value={formData[`${prefix}_school_name`] || ''}
                    onChange={(e) => onInputChange(`${prefix}_school_name`, e.target.value)}
                    placeholder={`Enter ${level.toLowerCase()} school name`}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor={`${prefix}_degree_course`}>Degree/Course</Label>
                <Input
                    id={`${prefix}_degree_course`}
                    value={formData[`${prefix}_degree_course`] || ''}
                    onChange={(e) => onInputChange(`${prefix}_degree_course`, e.target.value)}
                    placeholder="Enter degree or course"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor={`${prefix}_year_graduated`}>Year Graduated</Label>
                <Input
                    id={`${prefix}_year_graduated`}
                    value={formData[`${prefix}_year_graduated`] || ''}
                    onChange={(e) => onInputChange(`${prefix}_year_graduated`, e.target.value)}
                    placeholder="YYYY"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor={`${prefix}_highest_level`}>Highest Level</Label>
                <Input
                    id={`${prefix}_highest_level`}
                    value={formData[`${prefix}_highest_level`] || ''}
                    onChange={(e) => onInputChange(`${prefix}_highest_level`, e.target.value)}
                    placeholder="Enter highest level achieved"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor={`${prefix}_inclusive_dates`}>Inclusive Dates</Label>
                <Input
                    id={`${prefix}_inclusive_dates`}
                    value={formData[`${prefix}_inclusive_dates`] || ''}
                    onChange={(e) => onInputChange(`${prefix}_inclusive_dates`, e.target.value)}
                    placeholder="e.g., 2018-2022"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor={`${prefix}_honors`}>Honors/Awards</Label>
                <Input
                    id={`${prefix}_honors`}
                    value={formData[`${prefix}_honors`] || ''}
                    onChange={(e) => onInputChange(`${prefix}_honors`, e.target.value)}
                    placeholder="Enter honors or awards received"
                />
            </div>
        </CardContent>
    </Card>
);


const EmployeeDialog = ({
    editingEmployee,
    setEditingEmployee,
    departments,
    positions,
    benefitTypes,
    onEmployeeAdded,
    onEmployeeUpdated,
    onEmployeeArchived
}: EmployeeDialogProps) => {
    const token = localStorage.getItem('token');
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [, setSelectedBenefits] = useState<number[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [activeTab, setActiveTab] = useState('personal');
    const [, setSelectedAllowances] = useState<number[]>([]);
    const [allowanceTypes, setAllowanceTypes] = useState<AllowanceType[]>([]);

    const [formData, setFormData] = useState({

        //benefits and allowances arrays
        benefits: [] as { id: number; amount: string }[],
        allowances: [] as { id: number; amount: string }[],

        // Basic Information
        employee_id: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        suffix: '',
        email: '',
        phone: '',
        date_of_birth: '',
        place_of_birth: '',
        sex: '',
        civil_status: '',
        height_m: '',
        weight_kg: '',
        blood_type: '',
        citizenship: '',

        // Government IDs
        gsis_no: '',
        pagibig_no: '',
        philhealth_no: '',
        sss_no: '',
        tin_no: '',
        agency_employee_no: '',

        // Address Information
        residential_address: '',
        residential_zipcode: '',
        residential_tel_no: '',
        permanent_address: '',
        permanent_zipcode: '',
        permanent_tel_no: '',

        // Family Information
        spouse_name: '',
        spouse_occupation: '',
        spouse_employer: '',
        spouse_business_address: '',
        spouse_tel_no: '',
        father_name: '',
        mother_name: '',
        parents_address: '',

        // Emergency Contact
        emergency_contact_name: '',
        emergency_contact_number: '',
        emergency_contact_relation: '',

        // Education - Elementary
        elementary_school_name: '',
        elementary_degree_course: '',
        elementary_year_graduated: '',
        elementary_highest_level: '',
        elementary_inclusive_dates: '',
        elementary_honors: '',

        // Education - Secondary
        secondary_school_name: '',
        secondary_degree_course: '',
        secondary_year_graduated: '',
        secondary_highest_level: '',
        secondary_inclusive_dates: '',
        secondary_honors: '',

        // Education - Vocational
        vocational_school_name: '',
        vocational_degree_course: '',
        vocational_year_graduated: '',
        vocational_highest_level: '',
        vocational_inclusive_dates: '',
        vocational_honors: '',

        // Education - College
        college_school_name: '',
        college_degree_course: '',
        college_year_graduated: '',
        college_highest_level: '',
        college_inclusive_dates: '',
        college_honors: '',

        // Education - Graduate
        graduate_school_name: '',
        graduate_degree_course: '',
        graduate_year_graduated: '',
        graduate_highest_level: '',
        graduate_inclusive_dates: '',
        graduate_honors: '',

        // Employment Information
        department_id: '',
        position_id: '',
        employment_type_id: '',
        base_salary: '', //daily salary
        base_pay: '',
        night_hours: '',
        hire_date: '',
        shift_start: '',
        shift_end: '',

        // Status
        is_active: true,
        is_archived: 0,
        is_interviewer: 0,
        is_regular: 0,

        // Auth
        password: '',
        confirm_password: '',
        salary_mode: '',
        role: 'employee',
    });

    // Form validation
    const validateForm = () => {
        const errors: string[] = [];

        // Required fields
        if (!formData.first_name.trim()) errors.push('First name is required');
        if (!formData.last_name.trim()) errors.push('Last name is required');
        if (!formData.email.trim()) errors.push('Email is required');

        // Email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            errors.push('Please enter a valid email address');
        }

        // Password validation for new employees
        if (!editingEmployee) {
            if (!formData.password) errors.push('Password is required for new employees');
            if (formData.password.length < 8) errors.push('Password must be at least 8 characters long');
            if (formData.password !== formData.confirm_password) errors.push('Passwords do not match');
        }

        // Salary validation
        if (formData.base_salary && parseFloat(formData.base_salary) < 0) {
            errors.push('Base salary cannot be negative');
        }

        return errors;
    };


    useEffect(() => {
        const fetchAllowanceTypes = async () => {
            try {
                const response = await api.get('/dropdown/allowance-types', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.isSuccess) {
                    setAllowanceTypes(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch allowance types:', error);
            }
        };

        fetchAllowanceTypes();
    }, [token]);


    useEffect(() => {
        setIsOpen(!!editingEmployee);
        if (editingEmployee) {
            // Populate form with existing employee data
            setFormData({

                benefits: editingEmployee.benefits?.map(benefit => ({
                    id: benefit.id,
                    amount: benefit.amount?.toString() || '0'
                })) || [],
                allowances: editingEmployee.allowances?.map(allowance => ({
                    id: allowance.id,
                    amount: allowance.amount?.toString() || '0'
                })) || [],

                employee_id: editingEmployee.employee_id || '',
                first_name: editingEmployee.first_name || '',
                middle_name: editingEmployee.middle_name || '',
                last_name: editingEmployee.last_name || '',
                suffix: editingEmployee.suffix || '',
                email: editingEmployee.email || '',
                phone: editingEmployee.phone || '',
                date_of_birth: editingEmployee.date_of_birth || '',
                place_of_birth: editingEmployee.place_of_birth || '',
                sex: editingEmployee.sex || '',
                civil_status: editingEmployee.civil_status || '',
                height_m: editingEmployee.height_m || '',
                weight_kg: editingEmployee.weight_kg || '',
                blood_type: editingEmployee.blood_type || '',
                citizenship: editingEmployee.citizenship || '',

                gsis_no: editingEmployee.gsis_no || '',
                pagibig_no: editingEmployee.pagibig_no || '',
                philhealth_no: editingEmployee.philhealth_no || '',
                sss_no: editingEmployee.sss_no || '',
                tin_no: editingEmployee.tin_no || '',
                agency_employee_no: editingEmployee.agency_employee_no || '',

                residential_address: editingEmployee.residential_address || '',
                residential_zipcode: editingEmployee.residential_zipcode || '',
                residential_tel_no: editingEmployee.residential_tel_no || '',
                permanent_address: editingEmployee.permanent_address || '',
                permanent_zipcode: editingEmployee.permanent_zipcode || '',
                permanent_tel_no: editingEmployee.permanent_tel_no || '',

                spouse_name: editingEmployee.spouse_name || '',
                spouse_occupation: editingEmployee.spouse_occupation || '',
                spouse_employer: editingEmployee.spouse_employer || '',
                spouse_business_address: editingEmployee.spouse_business_address || '',
                spouse_tel_no: editingEmployee.spouse_tel_no || '',
                father_name: editingEmployee.father_name || '',
                mother_name: editingEmployee.mother_name || '',
                parents_address: editingEmployee.parents_address || '',

                emergency_contact_name: editingEmployee.emergency_contact_name || '',
                emergency_contact_number: editingEmployee.emergency_contact_number || '',
                emergency_contact_relation: editingEmployee.emergency_contact_relation || '',

                elementary_school_name: editingEmployee.elementary_school_name || '',
                elementary_degree_course: editingEmployee.elementary_degree_course || '',
                elementary_year_graduated: editingEmployee.elementary_year_graduated || '',
                elementary_highest_level: editingEmployee.elementary_highest_level || '',
                elementary_inclusive_dates: editingEmployee.elementary_inclusive_dates || '',
                elementary_honors: editingEmployee.elementary_honors || '',

                secondary_school_name: editingEmployee.secondary_school_name || '',
                secondary_degree_course: editingEmployee.secondary_degree_course || '',
                secondary_year_graduated: editingEmployee.secondary_year_graduated || '',
                secondary_highest_level: editingEmployee.secondary_highest_level || '',
                secondary_inclusive_dates: editingEmployee.secondary_inclusive_dates || '',
                secondary_honors: editingEmployee.secondary_honors || '',

                vocational_school_name: editingEmployee.vocational_school_name || '',
                vocational_degree_course: editingEmployee.vocational_degree_course || '',
                vocational_year_graduated: editingEmployee.vocational_year_graduated || '',
                vocational_highest_level: editingEmployee.vocational_highest_level || '',
                vocational_inclusive_dates: editingEmployee.vocational_inclusive_dates || '',
                vocational_honors: editingEmployee.vocational_honors || '',

                college_school_name: editingEmployee.college_school_name || '',
                college_degree_course: editingEmployee.college_degree_course || '',
                college_year_graduated: editingEmployee.college_year_graduated || '',
                college_highest_level: editingEmployee.college_highest_level || '',
                college_inclusive_dates: editingEmployee.college_inclusive_dates || '',
                college_honors: editingEmployee.college_honors || '',

                graduate_school_name: editingEmployee.graduate_school_name || '',
                graduate_degree_course: editingEmployee.graduate_degree_course || '',
                graduate_year_graduated: editingEmployee.graduate_year_graduated || '',
                graduate_highest_level: editingEmployee.graduate_highest_level || '',
                graduate_inclusive_dates: editingEmployee.graduate_inclusive_dates || '',
                graduate_honors: editingEmployee.graduate_honors || '',

                department_id: editingEmployee.department_id?.toString() || '',
                position_id: editingEmployee.position_id?.toString() || '',
                employment_type_id: editingEmployee.employment_type_id?.toString() || '',
                base_salary: editingEmployee.base_salary?.toString() || '',
                base_pay: editingEmployee.base_pay?.toString() || '',
                night_hours: editingEmployee.night_hours?.toString() || '',
                hire_date: editingEmployee.hire_date || '',
                shift_start: formatTimeForBackend(editingEmployee.shift_start || ''),
                shift_end: formatTimeForBackend(editingEmployee.shift_end || ''),

                is_active: editingEmployee.is_active ?? true,
                is_archived: Number(editingEmployee.is_archived ?? 0),
                is_interviewer: Number(editingEmployee.is_interviewer ?? 0),
                is_regular: Number(editingEmployee.is_regular ?? 0),
                password: '',
                confirm_password: '',
                salary_mode: editingEmployee.salary_mode || '',
                role: editingEmployee.role || 'employee',
            });

            // Set selected benefits
            if (editingEmployee.benefits && editingEmployee.benefits.length > 0) {
                setSelectedBenefits(editingEmployee.benefits.map(benefit => benefit.id));

            } else {
                setSelectedBenefits([]);

            }

            // Set selected allowances
            if (editingEmployee.allowances && editingEmployee.allowances.length > 0) {
                setSelectedAllowances(editingEmployee.allowances.map(allowance => allowance.id));

            } else {
                setSelectedAllowances([]);

            }





        } else {
            // Reset form for new employee
            const resetForm = {
                // Reset benefits and allowances
                benefits: [],
                allowances: [],

                employee_id: '',
                first_name: '',
                middle_name: '',
                last_name: '',
                suffix: '',
                email: '',
                phone: '',
                date_of_birth: '',
                place_of_birth: '',
                sex: '',
                civil_status: '',
                height_m: '',
                weight_kg: '',
                blood_type: '',
                citizenship: '',

                gsis_no: '',
                pagibig_no: '',
                philhealth_no: '',
                sss_no: '',
                tin_no: '',
                agency_employee_no: '',

                residential_address: '',
                residential_zipcode: '',
                residential_tel_no: '',
                permanent_address: '',
                permanent_zipcode: '',
                permanent_tel_no: '',

                spouse_name: '',
                spouse_occupation: '',
                spouse_employer: '',
                spouse_business_address: '',
                spouse_tel_no: '',
                father_name: '',
                mother_name: '',
                parents_address: '',

                emergency_contact_name: '',
                emergency_contact_number: '',
                emergency_contact_relation: '',

                elementary_school_name: '',
                elementary_degree_course: '',
                elementary_year_graduated: '',
                elementary_highest_level: '',
                elementary_inclusive_dates: '',
                elementary_honors: '',

                secondary_school_name: '',
                secondary_degree_course: '',
                secondary_year_graduated: '',
                secondary_highest_level: '',
                secondary_inclusive_dates: '',
                secondary_honors: '',

                vocational_school_name: '',
                vocational_degree_course: '',
                vocational_year_graduated: '',
                vocational_highest_level: '',
                vocational_inclusive_dates: '',
                vocational_honors: '',

                college_school_name: '',
                college_degree_course: '',
                college_year_graduated: '',
                college_highest_level: '',
                college_inclusive_dates: '',
                college_honors: '',

                graduate_school_name: '',
                graduate_degree_course: '',
                graduate_year_graduated: '',
                graduate_highest_level: '',
                graduate_inclusive_dates: '',
                graduate_honors: '',

                department_id: '',
                position_id: '',
                employment_type_id: '',
                base_salary: '', //daily salary
                base_pay: '',
                night_hours: '',
                hire_date: '',
                shift_start: '',
                shift_end: '',

                is_active: true,
                is_archived: 0,
                is_interviewer: 0,
                is_regular: 0,

                password: '',
                confirm_password: '',
                salary_mode: '',
                role: 'employee',
            };

            setFormData(resetForm);
            setSelectedBenefits([]);
            setSelectedAllowances([]);
            setFiles([]);
            setResumeFile(null);
            setActiveTab('personal');
        }
    }, [editingEmployee]);

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Normalize time values to `HH:MM` for backend validation
    const formatTimeForBackend = (value: any) => {
        if (!value && value !== 0) return '';
        const str = value.toString();
        const m = str.match(/(\d{1,2}):(\d{2})/);
        if (m) {
            const hh = m[1].padStart(2, '0');
            const mm = m[2];
            return `${hh}:${mm}`;
        }
        return str;
    };

    const handleBenefitToggle = (benefitId: number, checked: boolean) => {
        setFormData(prev => {
            if (checked) {
                // Add benefit with default amount 0
                return {
                    ...prev,
                    benefits: [...prev.benefits, { id: benefitId, amount: '0' }]
                };
            } else {
                // Remove benefit
                return {
                    ...prev,
                    benefits: prev.benefits.filter(b => b.id !== benefitId)
                };
            }
        });
    };

    // Remove the N/A disabling logic from handleAllowanceToggle
    const handleAllowanceToggle = (allowanceId: number, checked: boolean) => {
        setFormData(prev => {
            if (checked) {
                // Add allowance with default amount 0
                return {
                    ...prev,
                    allowances: [...prev.allowances, { id: allowanceId, amount: '0' }]
                };
            } else {
                // Remove allowance
                return {
                    ...prev,
                    allowances: prev.allowances.filter(a => a.id !== allowanceId)
                };
            }
        });
    };

    // Add handlers for amount changes
    const handleBenefitAmountChange = (benefitId: number, amount: string) => {
        setFormData(prev => ({
            ...prev,
            benefits: prev.benefits.map(b =>
                b.id === benefitId ? { ...b, amount } : b
            )
        }));
    };

    const handleAllowanceAmountChange = (allowanceId: number, amount: string) => {
        setFormData(prev => ({
            ...prev,
            allowances: prev.allowances.map(a =>
                a.id === allowanceId ? { ...a, amount } : a
            )
        }));
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: '201_file' | 'resume') => {
        const fileList = event.target.files;
        if (!fileList) return;

        if (type === 'resume') {
            setResumeFile(fileList[0]);
        } else {
            // Append new files instead of replacing
            setFiles((prevFiles) => [...prevFiles, ...Array.from(fileList)]);
        }
    };

    const removeFile = (index: number, type: '201_file' | 'resume') => {
        if (type === 'resume') {
            setResumeFile(null);
        } else {
            setFiles(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validate form
        const errors = validateForm();
        if (errors.length > 0) {
            setError(errors.join(', '));
            setLoading(false);
            return;
        }

        try {
            const submitData = new FormData();

            // Normalize time fields so backend accepts H:i format (HH:MM)
            const processedForm = {
                ...formData,
                shift_start: formatTimeForBackend(formData.shift_start),
                shift_end: formatTimeForBackend(formData.shift_end),
            };

            // Append all form data except password confirmation, benefits, and allowances
            Object.entries(processedForm).forEach(([key, value]) => {
                if (key !== 'confirm_password' && key !== 'benefits' && key !== 'allowances' && value !== null && value !== undefined && value !== '') {
                    if (typeof value === 'boolean') {
                        submitData.append(key, value ? '1' : '0');
                    } else {
                        submitData.append(key, value.toString());
                    }
                }
            });

            if (formData.benefits.length > 0) {
                // Convert benefits to the format expected by backend and append as array items
                formData.benefits.forEach((benefit, index) => {
                    submitData.append(`benefits[${index}][id]`, benefit.id.toString());
                    submitData.append(`benefits[${index}][amount]`, (parseFloat(benefit.amount) || 0).toString());
                });
            }

            // Handle allowances - send as array format
            if (formData.allowances.length > 0) {
                // Convert allowances to the format expected by backend and append as array items
                formData.allowances.forEach((allowance, index) => {
                    submitData.append(`allowances[${index}][id]`, allowance.id.toString());
                    submitData.append(`allowances[${index}][amount]`, (parseFloat(allowance.amount) || 0).toString());
                });
            }

            // Append files
            if (resumeFile) {
                submitData.append('resume', resumeFile);
            }

            files.forEach(file => {
                submitData.append('201_file[]', file);
            });

            // Files are submitted without console logging to avoid leaking
            // passwords, government IDs, or contact details.

            if (editingEmployee) {
                // Update existing employee
                const response = await api.post(`/update/employees/${editingEmployee.id}`, submitData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    }
                });

                if (response.data.isSuccess) {
                    onEmployeeUpdated();
                    setIsOpen(false);
                    setEditingEmployee(null);
                    toast.success(response.data.message || 'Employee updated successfully');
                } else {
                    throw new Error(response.data.message);
                }
            } else {
                // Create new employee
                const response = await api.post('/employees', submitData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    }
                });

                if (response.data.isSuccess) {
                    onEmployeeAdded();
                    setIsOpen(false);
                    setEditingEmployee(null);
                    toast.success(response.data.message || 'Employee created successfully');
                } else {
                    throw new Error(response.data.message);
                }
            }
        } catch (err: any) {
            console.error('Full error:', err.response?.data);
            if (err.response?.data?.errors) {
                const backendErrors = err.response.data.errors;
                const errorMessages = Object.entries(backendErrors)
                    .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                    .join('; ');
                const msg = `Validation failed: ${errorMessages}`;
                setError(msg);
                toast.error(msg);
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
                toast.error(err.response.data.message);
            } else {
                const msg = err instanceof Error ? err.message : 'An error occurred while saving employee';
                setError(msg);
                toast.error(msg);
            }
        } finally {
            setLoading(false);
        }
    };


    const handleDailyRateChange = (value: number | string) => {
        // Update the daily rate
        handleInputChange("base_salary", value);

        // Auto-update base_pay = daily × 20
        const daily = Number(value) || 0;
        const monthly = daily * 20;

        handleInputChange("base_pay", monthly);
    };

    const handleBasePayChange = (value: number | string) => {
        const monthly = Number(value) || 0;
        const daily = monthly / 20;

        handleInputChange("base_pay", monthly);
        handleInputChange("base_salary", daily);
    };


    const handleArchive = async () => {
        if (!editingEmployee) return;

        try {
            const response = await api.post(`/employees/${editingEmployee.id}`, {
                is_archived: 1
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.isSuccess) {
                onEmployeeArchived();
                setIsOpen(false);
                setEditingEmployee(null);
            } else {
                throw new Error(response.data.message);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to archive employee');
        }
    };

    const getTabIcon = (tabName: string) => {
        switch (tabName) {
            case 'personal': return <User className="h-4 w-4" />;
            case 'government': return <FileCheck className="h-4 w-4" />;
            case 'address': return <MapPin className="h-4 w-4" />;
            case 'family': return <Users className="h-4 w-4" />;
            case 'education': return <GraduationCap className="h-4 w-4" />;
            case 'employment': return <Briefcase className="h-4 w-4" />;
            case 'benefits': return <FileCheck className="h-4 w-4" />;
            case 'allowances': return <PhilippinePeso className="h-4 w-4" />;
            case 'files': return <FileText className="h-4 w-4" />;
            default: return <User className="h-4 w-4" />;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                setEditingEmployee(null);
                setError(null);
            }
            setIsOpen(open);
        }}>
            <DialogContent className="min-w-6xl  max-h-[90vh] overflow-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {editingEmployee ? (
                            <>
                                <User className="h-5 w-5" />
                                Edit Employee: {editingEmployee.first_name} {editingEmployee.last_name}
                            </>
                        ) : (
                            <>
                                <User className="h-5 w-5" />
                                Add New Employee
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {editingEmployee
                            ? `Update employee information and benefits`
                            : 'Create a new employee record with complete details'
                        }
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                            <strong className="font-medium">Error:</strong>
                            <div className="text-sm mt-1">{error}</div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-9">
                            {['personal', 'government', 'address', 'family', 'education', 'employment', 'benefits', 'allowances', 'files'].map((tab) => (
                                <TabsTrigger key={tab} value={tab} className="flex items-center gap-2">
                                    {getTabIcon(tab)}
                                    <span className="capitalize hidden sm:inline">{tab}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {/* Personal Information Tab */}
                        <TabsContent value="personal" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <div className='flex justify-between'>
                                        <div>

                                            <CardTitle>Basic Information</CardTitle>
                                            <CardDescription>
                                                Enter the employee's personal details
                                            </CardDescription>
                                        </div>

                                        <div className='space-y-2'>
                                            <Label htmlFor="first_name">Employee ID *</Label>
                                            <Input
                                                id="employee_id"
                                                value={formData.employee_id}
                                                onChange={(e) => handleInputChange('employee_id', e.target.value)}
                                                placeholder="Enter employee ID"
                                            />
                                        </div>
                                    </div>

                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="first_name">First Name *</Label>
                                            <Input
                                                id="first_name"
                                                value={formData.first_name}
                                                onChange={(e) => handleInputChange('first_name', e.target.value)}
                                                required
                                                placeholder="Enter first name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="middle_name">Middle Name</Label>
                                            <Input
                                                id="middle_name"
                                                value={formData.middle_name}
                                                onChange={(e) => handleInputChange('middle_name', e.target.value)}
                                                placeholder="Enter middle name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="last_name">Last Name *</Label>
                                            <Input
                                                id="last_name"
                                                value={formData.last_name}
                                                onChange={(e) => handleInputChange('last_name', e.target.value)}
                                                required
                                                placeholder="Enter last name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="suffix">Suffix</Label>
                                            <Input
                                                id="suffix"
                                                value={formData.suffix}
                                                onChange={(e) => handleInputChange('suffix', e.target.value)}
                                                placeholder="e.g., Jr., Sr., III"
                                            />
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                required
                                                placeholder="employee@company.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                value={formData.phone}
                                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                                placeholder="+63 XXX XXX XXXX"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="date_of_birth">Date of Birth</Label>
                                            <Input
                                                id="date_of_birth"
                                                type="date"
                                                value={formData.date_of_birth}
                                                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="place_of_birth">Place of Birth</Label>
                                            <Input
                                                id="place_of_birth"
                                                value={formData.place_of_birth}
                                                onChange={(e) => handleInputChange('place_of_birth', e.target.value)}
                                                placeholder="City, Province"
                                            />
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="sex">Sex</Label>
                                            <Select
                                                value={formData.sex}
                                                onValueChange={(value) => handleInputChange('sex', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select sex" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Male">Male</SelectItem>
                                                    <SelectItem value="Female">Female</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="civil_status">Civil Status</Label>
                                            <Select
                                                value={formData.civil_status}
                                                onValueChange={(value) => handleInputChange('civil_status', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select civil status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Single">Single</SelectItem>
                                                    <SelectItem value="Married">Married</SelectItem>
                                                    <SelectItem value="Divorced">Divorced</SelectItem>
                                                    <SelectItem value="Widowed">Widowed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="height_m">Height (meters)</Label>
                                            <Input
                                                id="height_m"
                                                type="number"
                                                step="0.01"
                                                value={formData.height_m}
                                                onChange={(e) => handleInputChange('height_m', e.target.value)}
                                                placeholder="1.75"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="weight_kg">Weight (kg)</Label>
                                            <Input
                                                id="weight_kg"
                                                type="number"
                                                step="0.1"
                                                value={formData.weight_kg}
                                                onChange={(e) => handleInputChange('weight_kg', e.target.value)}
                                                placeholder="70.5"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="blood_type">Blood Type</Label>
                                            <Input
                                                id="blood_type"
                                                value={formData.blood_type}
                                                onChange={(e) => handleInputChange('blood_type', e.target.value)}
                                                placeholder="e.g., O+"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="citizenship">Citizenship</Label>
                                            <Input
                                                id="citizenship"
                                                value={formData.citizenship}
                                                onChange={(e) => handleInputChange('citizenship', e.target.value)}
                                                placeholder="Filipino"
                                            />
                                        </div>
                                    </div>

                                    {(
                                        <>
                                            <Separator />

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Password fields – ONLY when creating (not editing) */}
                                                {!editingEmployee && (
                                                    <>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="password">Password *</Label>
                                                            <Input
                                                                id="password"
                                                                type="password"
                                                                value={formData.password}
                                                                onChange={(e) => handleInputChange('password', e.target.value)}
                                                                required
                                                                placeholder="Enter password"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="confirm_password">Confirm Password *</Label>
                                                            <Input
                                                                id="confirm_password"
                                                                type="password"
                                                                value={formData.confirm_password}
                                                                onChange={(e) =>
                                                                    handleInputChange('confirm_password', e.target.value)
                                                                }
                                                                required
                                                                placeholder="Confirm password"
                                                            />
                                                        </div>
                                                    </>
                                                )}

                                                {/* Mode of Salary – ALWAYS visible */}
                                                <div className="space-y-2 md:col-span-2">
                                                    <Label htmlFor="salary_mode">Mode of Salary</Label>
                                                    <textarea
                                                        id="salary_mode"
                                                        className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                        value={formData.salary_mode}
                                                        onChange={(e) =>
                                                            handleInputChange('salary_mode', e.target.value)
                                                        }
                                                        placeholder={`GCash 09xxxxxxxxx`}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Government IDs Tab */}
                        <TabsContent value="government" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Government Identification Numbers</CardTitle>
                                    <CardDescription>
                                        Enter the employee's government-issued identification numbers
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="gsis_no">GSIS No.</Label>
                                        <Input
                                            id="gsis_no"
                                            value={formData.gsis_no}
                                            onChange={(e) => handleInputChange('gsis_no', e.target.value)}
                                            placeholder="GSIS number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pagibig_no">PAG-IBIG No.</Label>
                                        <Input
                                            id="pagibig_no"
                                            value={formData.pagibig_no}
                                            onChange={(e) => handleInputChange('pagibig_no', e.target.value)}
                                            placeholder="PAG-IBIG number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="philhealth_no">PhilHealth No.</Label>
                                        <Input
                                            id="philhealth_no"
                                            value={formData.philhealth_no}
                                            onChange={(e) => handleInputChange('philhealth_no', e.target.value)}
                                            placeholder="PhilHealth number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sss_no">SSS No.</Label>
                                        <Input
                                            id="sss_no"
                                            value={formData.sss_no}
                                            onChange={(e) => handleInputChange('sss_no', e.target.value)}
                                            placeholder="SSS number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="tin_no">TIN No.</Label>
                                        <Input
                                            id="tin_no"
                                            value={formData.tin_no}
                                            onChange={(e) => handleInputChange('tin_no', e.target.value)}
                                            placeholder="Tax Identification Number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="agency_employee_no">Agency Employee No.</Label>
                                        <Input
                                            id="agency_employee_no"
                                            value={formData.agency_employee_no}
                                            onChange={(e) => handleInputChange('agency_employee_no', e.target.value)}
                                            placeholder="Agency employee number"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Address Information Tab */}
                        <TabsContent value="address" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Address Information</CardTitle>
                                    <CardDescription>
                                        Enter the employee's residential and permanent addresses
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <h4 className="font-semibold mb-4">Residential Address</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="residential_address">Address</Label>
                                                <Input
                                                    id="residential_address"
                                                    value={formData.residential_address}
                                                    onChange={(e) => handleInputChange('residential_address', e.target.value)}
                                                    placeholder="Street, Barangay, City"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="residential_zipcode">Zip Code</Label>
                                                <Input
                                                    id="residential_zipcode"
                                                    value={formData.residential_zipcode}
                                                    onChange={(e) => handleInputChange('residential_zipcode', e.target.value)}
                                                    placeholder="e.g., 1000"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="residential_tel_no">Telephone Number</Label>
                                                <Input
                                                    id="residential_tel_no"
                                                    value={formData.residential_tel_no}
                                                    onChange={(e) => handleInputChange('residential_tel_no', e.target.value)}
                                                    placeholder="Landline number"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div>
                                        <h4 className="font-semibold mb-4">Permanent Address</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="permanent_address">Address</Label>
                                                <Input
                                                    id="permanent_address"
                                                    value={formData.permanent_address}
                                                    onChange={(e) => handleInputChange('permanent_address', e.target.value)}
                                                    placeholder="Street, Barangay, City"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="permanent_zipcode">Zip Code</Label>
                                                <Input
                                                    id="permanent_zipcode"
                                                    value={formData.permanent_zipcode}
                                                    onChange={(e) => handleInputChange('permanent_zipcode', e.target.value)}
                                                    placeholder="e.g., 1000"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="permanent_tel_no">Telephone Number</Label>
                                                <Input
                                                    id="permanent_tel_no"
                                                    value={formData.permanent_tel_no}
                                                    onChange={(e) => handleInputChange('permanent_tel_no', e.target.value)}
                                                    placeholder="Landline number"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Emergency Contact</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="emergency_contact_name">Contact Name</Label>
                                        <Input
                                            id="emergency_contact_name"
                                            value={formData.emergency_contact_name}
                                            onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                                            placeholder="Full name of emergency contact"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="emergency_contact_number">Contact Number</Label>
                                        <Input
                                            id="emergency_contact_number"
                                            value={formData.emergency_contact_number}
                                            onChange={(e) => handleInputChange('emergency_contact_number', e.target.value)}
                                            placeholder="Emergency contact phone number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="emergency_contact_relation">Relationship</Label>
                                        <Input
                                            id="emergency_contact_relation"
                                            value={formData.emergency_contact_relation}
                                            onChange={(e) => handleInputChange('emergency_contact_relation', e.target.value)}
                                            placeholder="e.g., Spouse, Parent, Sibling"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Family Information Tab */}
                        <TabsContent value="family" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Family Information</CardTitle>
                                    <CardDescription>
                                        Enter the employee's family background and spouse information
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <h4 className="font-semibold mb-4">Parents Information</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="father_name">Father's Name</Label>
                                                <Input
                                                    id="father_name"
                                                    value={formData.father_name}
                                                    onChange={(e) => handleInputChange('father_name', e.target.value)}
                                                    placeholder="Father's full name"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="mother_name">Mother's Name</Label>
                                                <Input
                                                    id="mother_name"
                                                    value={formData.mother_name}
                                                    onChange={(e) => handleInputChange('mother_name', e.target.value)}
                                                    placeholder="Mother's full name"
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="parents_address">Parents' Address</Label>
                                                <Input
                                                    id="parents_address"
                                                    value={formData.parents_address}
                                                    onChange={(e) => handleInputChange('parents_address', e.target.value)}
                                                    placeholder="Parents' current address"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div>
                                        <h4 className="font-semibold mb-4">Spouse Information</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="spouse_name">Spouse's Name</Label>
                                                <Input
                                                    id="spouse_name"
                                                    value={formData.spouse_name}
                                                    onChange={(e) => handleInputChange('spouse_name', e.target.value)}
                                                    placeholder="Spouse's full name"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="spouse_occupation">Spouse's Occupation</Label>
                                                <Input
                                                    id="spouse_occupation"
                                                    value={formData.spouse_occupation}
                                                    onChange={(e) => handleInputChange('spouse_occupation', e.target.value)}
                                                    placeholder="Spouse's occupation"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="spouse_employer">Spouse's Employer</Label>
                                                <Input
                                                    id="spouse_employer"
                                                    value={formData.spouse_employer}
                                                    onChange={(e) => handleInputChange('spouse_employer', e.target.value)}
                                                    placeholder="Spouse's employer"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="spouse_tel_no">Spouse's Telephone</Label>
                                                <Input
                                                    id="spouse_tel_no"
                                                    value={formData.spouse_tel_no}
                                                    onChange={(e) => handleInputChange('spouse_tel_no', e.target.value)}
                                                    placeholder="Spouse's contact number"
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="spouse_business_address">Spouse's Business Address</Label>
                                                <Input
                                                    id="spouse_business_address"
                                                    value={formData.spouse_business_address}
                                                    onChange={(e) => handleInputChange('spouse_business_address', e.target.value)}
                                                    placeholder="Spouse's business or work address"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Education Tab */}
                        <TabsContent value="education" className="space-y-4">
                            <EducationLevel
                                level="Elementary"
                                prefix="elementary"
                                formData={formData}
                                onInputChange={handleInputChange}
                            />
                            <EducationLevel
                                level="Secondary"
                                prefix="secondary"
                                formData={formData}
                                onInputChange={handleInputChange}
                            />
                            <EducationLevel
                                level="Vocational"
                                prefix="vocational"
                                formData={formData}
                                onInputChange={handleInputChange}
                            />
                            <EducationLevel
                                level="College"
                                prefix="college"
                                formData={formData}
                                onInputChange={handleInputChange}
                            />
                            <EducationLevel
                                level="Graduate"
                                prefix="graduate"
                                formData={formData}
                                onInputChange={handleInputChange}
                            />
                        </TabsContent>

                        {/* Employment Information Tab */}
                        <TabsContent value="employment" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Employment Details</CardTitle>
                                    <CardDescription>
                                        Set the employee's position, department, and compensation
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="department_id">Department</Label>
                                            <Select
                                                value={formData.department_id}
                                                onValueChange={(value) => handleInputChange('department_id', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select department" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {departments.map((dept) => (
                                                        <SelectItem key={dept.id} value={dept.id.toString()}>
                                                            {dept.department_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="position_id">Position</Label>
                                            <Select
                                                value={formData.position_id}
                                                onValueChange={(value) => handleInputChange('position_id', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select position" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {positions.map((pos) => (
                                                        <SelectItem key={pos.id} value={pos.id.toString()}>
                                                            {pos.position_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="base_salary">Daily Rate Salary (PHP)</Label>
                                            <Input
                                                id="base_salary"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.base_salary}
                                                onChange={(e) => handleDailyRateChange(e.target.value)}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="base_pay">BASE SALARY (PHP)</Label>
                                            <Input
                                                id="base_pay"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.base_pay}
                                                onChange={(e) => handleBasePayChange(e.target.value)}
                                                placeholder="0.00"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="base_salary">Night Rate (10%) Put Hours</Label>
                                            <Input
                                                id="night_hours"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.night_hours}
                                                onChange={(e) => handleInputChange('night_hours', e.target.value)}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="hire_date">Hire Date</Label>
                                            <Input
                                                id="hire_date"
                                                type="date"
                                                value={formData.hire_date}
                                                onChange={(e) => handleInputChange('hire_date', e.target.value)}
                                            />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="shift_start">Shift Start</Label>
                                            <Input
                                                id="shift_start"
                                                type="time"
                                                value={formData.shift_start}
                                                onChange={(e) => handleInputChange('shift_start', e.target.value)}
                                            />
                                        </div>
                                          <div className="space-y-2">
                                            <Label htmlFor="shift_end">Shift End</Label>
                                            <Input
                                                id="shift_end"
                                                type="time"
                                                value={formData.shift_end}
                                                onChange={(e) => handleInputChange('shift_end', e.target.value)}
                                            />
                                        </div>

                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Employment Status</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="is_active" className="text-base">Active Employee</Label>
                                            <div className="text-sm text-muted-foreground">
                                                Employee is currently active and working
                                            </div>
                                        </div>
                                        <Switch
                                            id="is_active"
                                            checked={formData.is_active}
                                            onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="is_interviewer" className="text-base">Interviewer</Label>
                                            <div className="text-sm text-muted-foreground">
                                                Employee can become an Interviewer for the new applicants
                                            </div>
                                        </div>
                                        <Switch
                                            id="is_interviewer"
                                            checked={Boolean(formData.is_interviewer)}
                                            onCheckedChange={(checked) => handleInputChange('is_interviewer', checked ? 1 : 0)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="is_regular" className="text-base">Regular</Label>
                                            <div className="text-sm text-muted-foreground">
                                                Employee has completed probationary period and is now regularized
                                            </div>
                                        </div>
                                        <Switch
                                            id="is_regular"
                                            checked={Boolean(formData.is_regular)}
                                            onCheckedChange={(checked) => handleInputChange('is_regular', checked ? 1 : 0)}
                                        />
                                    </div>

                                    {editingEmployee && (
                                        <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="is_archived" className="text-base text-yellow-800">Archive Employee</Label>
                                                <div className="text-sm text-yellow-700">
                                                    Archive this employee record (reversible)
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleArchive}
                                                className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                                            >
                                                Archive
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Benefits Tab */}
                        <TabsContent value="benefits" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Employee Benefits</CardTitle>
                                    <CardDescription>
                                        Select the benefits this employee is eligible for and specify the amount for each benefit.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 gap-3">
                                        {benefitTypes.map((benefit) => {
                                            const isSelected = !!formData.benefits?.find(b => b.id === benefit.id);
                                            const benefitAmount = formData.benefits?.find(b => b.id === benefit.id)?.amount || '';

                                            return (
                                                <div
                                                    key={benefit.id}
                                                    className={`flex items-start space-x-3 p-3 border rounded-lg transition-colors ${isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}
                                                >
                                                    <div className="flex items-start space-x-3 flex-1">
                                                        <Checkbox
                                                            id={`benefit-${benefit.id}`}
                                                            checked={isSelected}
                                                            onCheckedChange={(checked) => handleBenefitToggle(benefit.id, checked as boolean)}
                                                            className="mt-1"
                                                        />
                                                        <label
                                                            htmlFor={`benefit-${benefit.id}`}
                                                            className="flex-1 cursor-pointer"
                                                            onClick={() => handleBenefitToggle(benefit.id, !isSelected)}
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-sm">{benefit.benefit_name}</span>
                                                                <span className="text-xs text-muted-foreground mt-1">
                                                                    {benefit.category} • Rate: {benefit.rate}
                                                                </span>
                                                            </div>
                                                        </label>
                                                    </div>
                                                    <div className="w-32">
                                                        <Label htmlFor={`benefit-amount-${benefit.id}`} className="text-xs">Amount</Label>
                                                        <Input
                                                            id={`benefit-amount-${benefit.id}`}
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={benefitAmount}
                                                            onChange={(e) => handleBenefitAmountChange(benefit.id, e.target.value)}
                                                            disabled={!isSelected}
                                                            placeholder="0.00"
                                                            className="h-8 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center gap-2 text-sm text-blue-700">
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                                {formData.benefits?.length || 0}
                                            </Badge>
                                            <span>benefits selected</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="allowances" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Employee Allowances</CardTitle>
                                    <CardDescription>
                                        Select the allowances this employee is eligible for and specify the amount for each allowance.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 gap-3">
                                        {allowanceTypes.map((allowance) => {
                                            const isSelected = !!formData.allowances?.find(a => a.id === allowance.id);
                                            const allowanceAmount = formData.allowances?.find(a => a.id === allowance.id)?.amount || '';

                                            return (
                                                <div
                                                    key={allowance.id}
                                                    className={`flex items-start space-x-3 p-3 border rounded-lg transition-colors ${isSelected ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'}`}
                                                >
                                                    <div className="flex items-start space-x-3 flex-1">
                                                        <Checkbox
                                                            id={`allowance-${allowance.id}`}
                                                            checked={isSelected}
                                                            onCheckedChange={(checked) => handleAllowanceToggle(allowance.id, checked as boolean)}
                                                            className="mt-1"
                                                        />
                                                        <label
                                                            htmlFor={`allowance-${allowance.id}`}
                                                            className="flex-1 cursor-pointer"
                                                            onClick={() => handleAllowanceToggle(allowance.id, !isSelected)}
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-sm">{allowance.type_name}</span>
                                                                <span className="text-xs text-muted-foreground mt-1">
                                                                    Type: Allowance
                                                                </span>
                                                            </div>
                                                        </label>
                                                    </div>
                                                    <div className="w-32">
                                                        <Label htmlFor={`allowance-amount-${allowance.id}`} className="text-xs">Amount</Label>
                                                        <Input
                                                            id={`allowance-amount-${allowance.id}`}
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={allowanceAmount}
                                                            onChange={(e) => handleAllowanceAmountChange(allowance.id, e.target.value)}
                                                            disabled={!isSelected}
                                                            placeholder="0.00"
                                                            className="h-8 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-center gap-2 text-sm text-green-700">
                                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                                                {formData.allowances?.length || 0}
                                            </Badge>
                                            <span>allowances selected</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>


                        {/* Files Tab */}
                        <TabsContent value="files" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Document Uploads</CardTitle>
                                    <CardDescription>
                                        Upload employee documents. Resume and 201 files will be stored securely.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="resume">Resume (PDF, DOC, DOCX)</Label>
                                            <Input
                                                id="resume"
                                                type="file"
                                                accept=".pdf,.doc,.docx,image/*"
                                                onChange={(e) => handleFileUpload(e, 'resume')}
                                            />
                                            {resumeFile && (
                                                <div className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg">
                                                    <div className="flex items-center space-x-2 text-green-700">
                                                        <FileText className="h-4 w-4" />
                                                        <span className="text-sm font-medium">{resumeFile.name}</span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeFile(0, 'resume')}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="201_files">201 Files (Multiple files allowed)</Label>
                                            <Input
                                                id="201_files"
                                                type="file"
                                                multiple
                                                accept=".pdf,.doc,.docx,.jpeg,.png,.xlsx"
                                                onChange={(e) => handleFileUpload(e, '201_file')}
                                            />
                                            {files.length > 0 && (
                                                <div className="space-y-2">
                                                    {files.map((file, index) => (
                                                        <div key={index} className="flex items-center justify-between p-3 border border-blue-200 bg-blue-50 rounded-lg">
                                                            <div className="flex items-center space-x-2 text-blue-700">
                                                                <FileText className="h-4 w-4" />
                                                                <span className="text-sm font-medium">{file.name}</span>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeFile(index, '201_file')}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                Remove
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg border">
                                        <h4 className="font-medium text-sm mb-2">Upload Guidelines:</h4>
                                        <ul className="text-xs text-muted-foreground space-y-1">
                                            <li>• Maximum file size: 2MB per file</li>
                                            <li>• Supported formats: PDF, DOC, DOCX, JPEG, PNG, XLSX</li>
                                            <li>• Resume should be in PDF or Word format</li>
                                            <li>• 201 files can include various employment documents</li>
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsOpen(false);
                                setEditingEmployee(null);
                                setError(null);
                            }}
                            disabled={loading}
                            className="sm:order-1"
                        >
                            Cancel
                        </Button>
                        <div className="flex-1 sm:order-2">
                            {editingEmployee && (
                                <div className="text-sm text-muted-foreground">
                                    Last updated: {editingEmployee.updated_at ? new Date(editingEmployee.updated_at).toLocaleDateString() : 'N/A'}
                                </div>
                            )}
                        </div>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="sm:order-3"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Saving...
                                </>
                            ) : (
                                editingEmployee ? 'Update Employee' : 'Create Employee'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    );
};

export default EmployeeDialog;