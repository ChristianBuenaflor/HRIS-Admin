import {
    Building2,
    Users,
    Briefcase,
    Calendar,
    Gift,
    MapPin,
    ChevronsUp,
    CreditCard,
} from 'lucide-react';

export const setupSteps = [
    { id: 'company', label: 'Company Info', icon: Building2 },
    { id: 'departments', label: 'Departments', icon: Users },
    { id: 'positions', label: 'Job Positions', icon: Briefcase },
    { id: 'leave', label: 'Leave Types', icon: Calendar },
    { id: 'locations', label: 'Work Locations', icon: MapPin },
    { id: 'employment', label: 'Employment Types', icon: Users },
    { id: 'benefits', label: 'Benefits\n(deductions)', icon: Gift },
    { id: 'allowance', label: 'Allowance\n(Additional)', icon: ChevronsUp },
    { id: 'loans', label: 'Loan Types', icon: CreditCard },
];

export const defaultSetupData = {
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

    departments: [
        { id: '1', name: 'Engineering', description: 'Software development and technical operations' },
        { id: '2', name: 'Marketing', description: 'Brand management and customer engagement' },
        { id: '3', name: 'Sales', description: 'Revenue generation and client relations' },
        { id: '4', name: 'Human Resources', description: 'Employee management and organizational development' },
        { id: '5', name: 'Finance', description: 'Financial planning and accounting' },
    ],

    positions: [
        { id: '1', title: 'Software Engineer', department: 'Engineering', level: 'Mid-Level' },
        { id: '2', title: 'Senior Software Engineer', department: 'Engineering', level: 'Senior' },
        { id: '3', title: 'Marketing Manager', department: 'Marketing', level: 'Manager' },
        { id: '4', title: 'Sales Representative', department: 'Sales', level: 'Entry' },
        { id: '5', title: 'HR Manager', department: 'Human Resources', level: 'Manager' },
    ],

    leaveTypes: [
        { id: '1', name: 'Annual Leave', defaultDays: 15, requiresApproval: true },
        { id: '2', name: 'Sick Leave', defaultDays: 10, requiresApproval: false },
        { id: '3', name: 'Personal Leave', defaultDays: 5, requiresApproval: true },
        { id: '4', name: 'Maternity Leave', defaultDays: 90, requiresApproval: true },
        { id: '5', name: 'Paternity Leave', defaultDays: 14, requiresApproval: true },
    ],

    benefitTypes: [
        { id: '1', name: 'Health Insurance', category: 'Health', description: 'Comprehensive health coverage' },
        { id: '2', name: 'Dental Insurance', category: 'Health', description: 'Dental care coverage' },
        { id: '3', name: '401(k) Match', category: 'Retirement', description: 'Company 401k matching' },
        { id: '4', name: 'Life Insurance', category: 'Insurance', description: 'Life insurance coverage' },
        { id: '5', name: 'Gym Membership', category: 'Wellness', description: 'Fitness center access' },
    ],

    employmentTypes: [
        { id: '1', name: 'Full-Time', description: 'Regular full-time employment' },
        { id: '2', name: 'Part-Time', description: 'Part-time employment' },
        { id: '3', name: 'Contract', description: 'Fixed-term contract' },
        { id: '4', name: 'Intern', description: 'Internship position' },
        { id: '5', name: 'Consultant', description: 'External consultant' },
    ],

    workLocations: [
        { id: '1', name: 'Headquarters', address: '123 Main St, New York, NY', isRemote: false },
        { id: '2', name: 'West Coast Office', address: '456 Tech Ave, San Francisco, CA', isRemote: false },
        { id: '3', name: 'Remote', address: 'Various Locations', isRemote: true },
    ],

    allowance: [
        { id: '1', name: 'Transportation Allowance', amount: 2000, type: 'Monthly' },
        { id: '2', name: 'Meal Allowance', amount: 1500, type: 'Monthly' },
        { id: '3', name: 'Internet Allowance', amount: 1000, type: 'Monthly' },
        { id: '4', name: 'Housing Allowance', amount: 5000, type: 'Monthly' },
        { id: '5', name: 'Performance Bonus', amount: 3000, type: 'Quarterly' },
    ],

    loanTypes: [
        { id: '1', type_name: 'Emergency Loan', description: 'For urgent financial needs', amount: 5000, amount_limit: 20000 },
        { id: '2', type_name: 'Housing Loan', description: 'For housing-related expenses', amount: 100000, amount_limit: 500000 },
        { id: '3', type_name: 'Educational Loan', description: 'For educational purposes', amount: 20000, amount_limit: 100000 },
        { id: '4', type_name: 'Medical Loan', description: 'For medical emergencies', amount: 30000, amount_limit: 150000 },
        { id: '5', type_name: 'Vehicle Loan', description: 'For vehicle purchase', amount: 50000, amount_limit: 300000 },
    ],

};