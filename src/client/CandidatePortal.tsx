import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
    MapPin,
    Clock,
    PhilippinePeso,
    Building2,
    Users,
    Search,
    Filter,
    ArrowRight,
    CheckCircle,
    Upload,
    Star,
    Globe,
    Heart,
    Award,
} from "lucide-react";

import { toast } from "sonner";

import { BASE_URL_API as api } from "@/utils/BASE_URL_API";


interface Department {
    id: string;
    department_name: string;
}

interface WorkLocation {
    id: string;
    location_name: string;
}

interface JobPosting {
    id: string;
    title: string;
    department_id: string;
    department?: Department;
    location: string;
    salary_range: string;
    status: string;
    is_archived: boolean;
    created_at: string;
    description?: string;
    responsibilities?: string[];
    requirements?: string[];
    benefits?: string[];
    type?: string;
    remote?: string;
    featured?: boolean;
}

interface PaginationInfo {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}

interface JobPostingsResponse {
    isSuccess: boolean;
    message: string;
    job_postings: JobPosting[];
    pagination: PaginationInfo;
}

interface ApplicationFormData {
    job_posting_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    resume: File | null;
    cover_letter: string;
    linkedin_profile: string;
    portfolio_website: string;
    salary_expectations: string;
    available_start_date: string;
    experience_years: any;
}

const companyInfo = {
    name: "SNL IT Solutions",
    description:
        "We're revolutionizing human resources technology with innovative solutions that help companies manage their most valuable asset - their people.",
    mission:
        "SnL Virtual Partner's mission is to provide businesses with high-quality virtual outsourcing services that let them concentrate on their core competencies and meet their strategic goals.",
    values: ["Innovation", "Collaboration", "Integrity", "Growth", "Customer Focus"],
    stats: {
        employees: "10+",
        offices: "2",
        founded: "2014",
        customers: "1000+",
    },
};

export function CandidatePortal() {
    const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [locationFilter, setLocationFilter] = useState("all");
    const [departmentFilter, setDepartmentFilter] = useState("all");
    const [showApplicationForm, setShowApplicationForm] = useState(false);
    const [applicationSubmitted, setApplicationSubmitted] = useState(false);
    const [applicationError, setApplicationError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [workLocations, setWorkLocations] = useState<WorkLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    // Application form state
    const [applicationData, setApplicationData] = useState<ApplicationFormData>({
        job_posting_id: "",
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        resume: null,
        cover_letter: "",
        linkedin_profile: "",
        portfolio_website: "",
        salary_expectations: "",
        available_start_date: "",
        experience_years: "",
    });

    const fetchJobPostings = async (search = "", departmentId = "", page = 1) => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (departmentId && departmentId !== "all") params.append("department_id", departmentId);
            params.append("per_page", "12");
            params.append("page", String(page));

            const response = await fetch(`${api}/job-postings?${params.toString()}`);
            if (!response.ok) throw new Error("Failed to fetch job postings");

            const data: JobPostingsResponse = await response.json();
            if (data.isSuccess) {
                setJobs(data.job_postings.filter(job => job.status === "active"));
                setPagination(data.pagination);
            } else throw new Error(data.message);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
            console.error("Error fetching job postings:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await fetch(`${api}/departments`);
            const data = await response.json();
            if (response.ok && data.isSuccess) setDepartments(data.data || []);
        } catch (err) {
            console.error("Error fetching departments:", err);
        }
    };

    const fetchWorkLocations = async () => {
        try {
            const response = await fetch(`${api}/work-locations`);
            const data = await response.json();
            if (response.ok && data.isSuccess) setWorkLocations(data.data || []);
        } catch (err) {
            console.error("Error fetching work locations:", err);
        }
    };

    useEffect(() => {
        fetchJobPostings();
        fetchDepartments();
        fetchWorkLocations();
    }, []);

    const filteredJobs = jobs.filter((job) => {
        const matchesLocation =
            !locationFilter || locationFilter === "all" || job.location.toLowerCase().includes(locationFilter.toLowerCase());
        const matchesDepartment = !departmentFilter || departmentFilter === "all" || job.department_id === departmentFilter;
        return matchesLocation && matchesDepartment;
    });

    const handleSearch = () => fetchJobPostings(searchTerm, departmentFilter);
    const handleDepartmentFilterChange = (value: string) => {
        setDepartmentFilter(value);
        fetchJobPostings(searchTerm, value);
    };
    const handleLocationFilterChange = (value: string) => setLocationFilter(value);

    const handleApplyNow = (job: JobPosting) => {
        setShowApplicationForm(true);
        setSelectedJob(job);
        // Set the job_posting_id when applying
        setApplicationData(prev => ({
            ...prev,
            job_posting_id: job.id
        }));
        setApplicationError(null);
    };

    const handleInputChange = (field: keyof ApplicationFormData, value: string | number | File) => {
        setApplicationData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setApplicationData(prev => ({
            ...prev,
            resume: file
        }));
    };

    const handleSubmitApplication = async () => {
        if (!selectedJob) return;

        setIsSubmitting(true);
        setApplicationError(null);

        try {
            // Validate required fields
            if (!applicationData.first_name || !applicationData.last_name || !applicationData.email) {
                throw new Error("First name, last name, and email are required fields.");
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(applicationData.email)) {
                throw new Error("Please enter a valid email address.");
            }

            // Validate phone number if provided
            if (applicationData.phone_number && !/^\d+$/.test(applicationData.phone_number)) {
                throw new Error("Phone number should contain only digits.");
            }

            // Format date properly - convert to YYYY-MM-DD or set to empty string
            let formattedStartDate = '';
            if (applicationData.available_start_date) {
                // If it's already in date format, use it directly
                if (/^\d{4}-\d{2}-\d{2}$/.test(applicationData.available_start_date)) {
                    formattedStartDate = applicationData.available_start_date;
                } else {
                    // Try to parse the date or set to empty if invalid
                    const parsedDate = new Date(applicationData.available_start_date);
                    if (!isNaN(parsedDate.getTime())) {
                        formattedStartDate = parsedDate.toISOString().split('T')[0];
                    }
                    // If we can't parse it, leave as empty string (nullable in backend)
                }
            }

            const formData = new FormData();

            // Append all form data with proper formatting
            formData.append('job_posting_id', selectedJob.id?.toString() || applicationData.job_posting_id);
            formData.append('first_name', applicationData.first_name.trim());
            formData.append('last_name', applicationData.last_name.trim());
            formData.append('email', applicationData.email.trim().toLowerCase());
            formData.append('phone_number', applicationData.phone_number?.trim() || '');
            formData.append('cover_letter', applicationData.cover_letter?.trim() || '');
            formData.append('linkedin_profile', applicationData.linkedin_profile?.trim() || '');
            formData.append('portfolio_website', applicationData.portfolio_website?.trim() || '');
            formData.append('salary_expectations', applicationData.salary_expectations?.trim() || '');
            formData.append('available_start_date', formattedStartDate);

            // Convert experience_years to integer
            const experienceYears = parseInt(applicationData.experience_years) || 0;
            formData.append('experience_years', experienceYears.toString());

            // Append resume file if exists
            if (applicationData.resume) {
                // Validate file type and size
                if (applicationData.resume.size > 2 * 1024 * 1024) { // 2MB limit
                    throw new Error("Resume file size should be less than 2MB.");
                }

                const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
                if (!allowedTypes.includes(applicationData.resume.type)) {
                    throw new Error("Please upload a PDF, DOC, DOCX, JPG, or PNG file.");
                }

                formData.append('resume', applicationData.resume);
            }

            // Do not log FormData contents: may contain PII and resume file metadata.

            const response = await fetch(`${api}/create/applicants`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                },
            });

            // Check if response is OK before parsing JSON
            if (!response.ok) {
                // Try to get error message from response
                const errorText = await response.text();
                console.error('Server response:', errorText);

                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorMessage;
                } catch {
                    // If not JSON, use the text as is
                    errorMessage = errorText || errorMessage;
                }

                throw new Error(errorMessage);
            }

            const result = await response.json();

            if (result.isSuccess) {
                setApplicationSubmitted(true);
                setShowApplicationForm(false);
                setSelectedJob(null);

                // Reset form data
                setApplicationData({
                    job_posting_id: "",
                    first_name: "",
                    last_name: "",
                    email: "",
                    phone_number: "",
                    resume: null,
                    cover_letter: "",
                    linkedin_profile: "",
                    portfolio_website: "",
                    salary_expectations: "",
                    available_start_date: "",
                    experience_years: "",
                });

                setTimeout(() => setApplicationSubmitted(false), 5000);
            } else {
                throw new Error(result.message || 'Failed to submit application');
            }
        } catch (err) {
            console.error('Application submission error:', err);
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
            setApplicationError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle closing the application form
    const handleCloseApplicationForm = () => {
        setShowApplicationForm(false);
        setSelectedJob(null); // Clear selected job when closing application form
        setApplicationError(null);
    };

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) return "1 day ago";
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        return `${Math.ceil(diffDays / 30)} months ago`;
    };

    const getUniqueJobLocations = () => [...new Set(jobs.map((job) => job.location).filter(Boolean))];

    const renderJobCard = (job: JobPosting) => {
        const department = departments.find((dept) => dept.id === job.department_id);
        const departmentName = department?.department_name || "Unknown Department";
        const postedTime = formatRelativeTime(job.created_at);

        return (
            <Card key={job.id} className={`relative ${job.featured ? "ring-2 ring-primary" : ""}`}>
                {job.featured && (
                    <div className="absolute -top-2 left-4">
                        <Badge className="bg-primary">Featured</Badge>
                    </div>
                )}
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <CardTitle className="text-xl">{job.title}</CardTitle>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Building2 className="w-4 h-4" />
                                    {departmentName}
                                </span>
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {job.location}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {job.type || "Full-time"}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Globe className="w-4 h-4" />
                                    {job.remote || "Hybrid"}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-1 text-primary font-semibold">
                                <PhilippinePeso className="w-4 h-4" />
                                {job.salary_range}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">{postedTime}</div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                        {job.description || "Join our team and contribute to exciting projects in a dynamic environment."}
                    </p>
                    <div className="flex justify-between items-center">
                        <Button variant="outline" onClick={() => setSelectedJob(job)}>
                            View Details
                        </Button>
                        <Button onClick={() => handleApplyNow(job)}>
                            Apply Now
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl font-bold mb-4">Join Our Amazing Team</h1>
                        <p className="text-xl mb-8 opacity-90">
                            Discover exciting career opportunities at {companyInfo.name} and help us shape the future of HR technology.
                        </p>
                        <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                <span>{companyInfo.stats.employees} Employees</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Building2 className="w-5 h-5" />
                                <span>{companyInfo.stats.offices} Offices</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Star className="w-5 h-5" />
                                <span>Founded {companyInfo.stats.founded}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Heart className="w-5 h-5" />
                                <span>{companyInfo.stats.customers} Happy Customers</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="container mx-auto px-4 py-8 mt-4">
                <div className="bg-card rounded-lg border p-6 -mt-8 shadow-lg">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="search">Search Jobs</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="search"
                                    placeholder="Job title or keyword"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <Select value={departmentFilter} onValueChange={handleDepartmentFilterChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All departments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All departments</SelectItem>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id}>
                                            {dept.department_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Select value={locationFilter} onValueChange={handleLocationFilterChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All locations" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All locations</SelectItem>
                                    {workLocations.map((location) => (
                                        <SelectItem key={location.id} value={location.location_name}>
                                            {location.location_name}
                                        </SelectItem>
                                    ))}
                                    {/* Fallback for locations that might be in jobs but not in workLocations API */}
                                    {getUniqueJobLocations().map((location, index) => (
                                        !workLocations.some(wl => wl.location_name === location) && (
                                            <SelectItem key={`fallback-${index}`} value={location}>
                                                {location}
                                            </SelectItem>
                                        )
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:flex items-end gap-2">
                            <Button
                                onClick={handleSearch}
                                className="w-full"
                            >
                                <Search className="w-4 h-4 mr-2" />
                                Search
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    setSearchTerm('');
                                    setLocationFilter('all');
                                    setDepartmentFilter('all');
                                    fetchJobPostings(); // Reset to initial state
                                }}
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                Clear
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Job Listings */}
            <div className="container mx-auto px-4 pb-16">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">
                        {loading ? 'Loading...' : `${filteredJobs.length} Open Position${filteredJobs.length !== 1 ? 's' : ''}`}
                    </h2>
                    <div className="text-sm text-muted-foreground">
                        {pagination && `Page ${pagination.current_page} of ${pagination.last_page}`}
                    </div>
                </div>

                {error && (
                    <div className="bg-destructive/15 text-destructive p-4 rounded-lg mb-6">
                        <p>Error: {error}</p>
                        <Button variant="outline" size="sm" onClick={() => fetchJobPostings()} className="mt-2">
                            Try Again
                        </Button>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading job opportunities...</p>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-6">
                            {filteredJobs.map(renderJobCard)}
                        </div>

                        {filteredJobs.length === 0 && (
                            <div className="text-center py-12">
                                <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
                                <p className="text-muted-foreground">
                                    Try adjusting your search criteria or check back later for new opportunities.
                                </p>
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination && pagination.last_page > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-8">
                                <Button
                                    variant="outline"
                                    disabled={pagination.current_page === 1}
                                    onClick={() => fetchJobPostings(searchTerm, departmentFilter, pagination.current_page - 1)}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {pagination.current_page} of {pagination.last_page}
                                </span>
                                <Button
                                    variant="outline"
                                    disabled={pagination.current_page === pagination.last_page}
                                    onClick={() => fetchJobPostings(searchTerm, departmentFilter, pagination.current_page + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Company Info Section */}
            <div className="bg-muted/50 py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl font-bold mb-6">Why Work With Us?</h2>
                        <p className="text-lg text-muted-foreground mb-8">{companyInfo.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                            <div className="space-y-4">
                                <div className="w-12 h-12 bg-primary rounded-lg mx-auto flex items-center justify-center">
                                    <Award className="w-6 h-6 text-primary-foreground" />
                                </div>
                                <h3 className="font-semibold">Innovation First</h3>
                                <p className="text-sm text-muted-foreground">
                                    Work with cutting-edge technology and contribute to innovative solutions.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="w-12 h-12 bg-primary rounded-lg mx-auto flex items-center justify-center">
                                    <Heart className="w-6 h-6 text-primary-foreground" />
                                </div>
                                <h3 className="font-semibold">Great Culture</h3>
                                <p className="text-sm text-muted-foreground">
                                    Join a supportive, inclusive environment where everyone can thrive.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="w-12 h-12 bg-primary rounded-lg mx-auto flex items-center justify-center">
                                    <Star className="w-6 h-6 text-primary-foreground" />
                                </div>
                                <h3 className="font-semibold">Growth Opportunities</h3>
                                <p className="text-sm text-muted-foreground">
                                    Advance your career with continuous learning and development programs.
                                </p>
                            </div>
                        </div>

                        <div className="bg-card rounded-lg border p-6">
                            <h3 className="font-semibold mb-4">Our Values</h3>
                            <div className="flex flex-wrap justify-center gap-3">
                                {companyInfo.values.map((value, index) => (
                                    <Badge key={index} variant="outline" className="text-sm">
                                        {value}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Job Details Dialog */}
            {selectedJob && (
                <Dialog open={!!selectedJob && !showApplicationForm} onOpenChange={() => setSelectedJob(null)}>

                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <DialogTitle className="text-2xl">{selectedJob.title}</DialogTitle>
                                    <DialogDescription className="flex items-center gap-4 mt-2 text-base">
                                        <span className="flex items-center gap-1">
                                            <Building2 className="w-4 h-4" />
                                            {departments.find(dept => dept.id === selectedJob.department_id)?.department_name || 'Unknown Department'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {selectedJob.location}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <PhilippinePeso className="w-4 h-4" />
                                            {selectedJob.salary_range}
                                        </span>
                                    </DialogDescription>
                                </div>
                                {selectedJob.featured && <Badge className="bg-primary">Featured</Badge>}
                            </div>
                        </DialogHeader>

                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold mb-3">Job Description</h3>
                                <p className="text-muted-foreground">
                                    {selectedJob.description || 'No description available.'}
                                </p>
                            </div>

                            {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <h3 className="font-semibold mb-3">Key Responsibilities</h3>
                                        <ul className="space-y-2">
                                            {selectedJob.responsibilities.map((resp: any, index: any) => (
                                                <li key={index} className="flex items-start gap-2 text-muted-foreground">
                                                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                                    {resp}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </>
                            )}

                            {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <h3 className="font-semibold mb-3">Requirements</h3>
                                        <ul className="space-y-2">
                                            {selectedJob.requirements.map((req: any, index: any) => (
                                                <li key={index} className="flex items-start gap-2 text-muted-foreground">
                                                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                                    {req}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </>
                            )}

                            {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <h3 className="font-semibold mb-3">Benefits & Perks</h3>
                                        <ul className="space-y-2">
                                            {selectedJob.benefits.map((benefit: any, index: any) => (
                                                <li key={index} className="flex items-start gap-2 text-muted-foreground">
                                                    <Star className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                                    {benefit}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </>
                            )}
                        </div>

                        <DialogFooter className="flex gap-3">
                            <Button variant="outline" onClick={() => setSelectedJob(null)}>
                                Close
                            </Button>
                            <Button onClick={() => handleApplyNow(selectedJob)}>
                                Apply for This Position
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Application Form Dialog */}
            <Dialog open={showApplicationForm} onOpenChange={(open) => {
                if (!open) {
                    handleCloseApplicationForm();
                } else {
                    setShowApplicationForm(true);
                }
            }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
                        <DialogDescription>
                            Fill out the form below to submit your application. We'll review it and get back to you soon.
                        </DialogDescription>
                    </DialogHeader>

                    {applicationError && (
                        <div className="bg-destructive/15 text-destructive p-4 rounded-lg">
                            <p>{applicationError}</p>
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name *</Label>
                                <Input
                                    id="firstName"
                                    placeholder="John"
                                    value={applicationData.first_name}
                                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name *</Label>
                                <Input
                                    id="lastName"
                                    placeholder="Doe"
                                    value={applicationData.last_name}
                                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john.doe@email.com"
                                value={applicationData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                placeholder="+1 (555) 123-4567"
                                value={applicationData.phone_number}
                                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="experience">Years of Experience</Label>
                            <Input
                                id="experience"
                                type="number"
                                placeholder="5"
                                min="0"
                                value={applicationData.experience_years}
                                onChange={(e) => handleInputChange('experience_years', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="resume">Resume/CV *</Label>
                            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground mb-2">
                                    {applicationData.resume ? applicationData.resume.name : "Drag and drop your resume or click to browse"}
                                </p>
                                <Input
                                    id="resume"
                                    type="file"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => document.getElementById('resume')?.click()}
                                >
                                    Choose File
                                </Button>
                                {applicationData.resume && (
                                    <p className="text-xs text-green-600 mt-2">
                                        ✓ {applicationData.resume.name} selected
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="coverLetter">Cover Letter</Label>
                            <Textarea
                                id="coverLetter"
                                placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                                rows={4}
                                value={applicationData.cover_letter}
                                onChange={(e) => handleInputChange('cover_letter', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="linkedin">LinkedIn Profile</Label>
                            <Input
                                id="linkedin"
                                placeholder="https://linkedin.com/in/yourprofile"
                                value={applicationData.linkedin_profile}
                                onChange={(e) => handleInputChange('linkedin_profile', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="portfolio">Portfolio/Website</Label>
                            <Input
                                id="portfolio"
                                placeholder="https://yourportfolio.com"
                                value={applicationData.portfolio_website}
                                onChange={(e) => handleInputChange('portfolio_website', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="salary">Salary Expectations</Label>
                            <Input
                                id="salary"
                                placeholder="$80,000 - $100,000"
                                value={applicationData.salary_expectations}
                                onChange={(e) => handleInputChange('salary_expectations', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="availability">Available Start Date</Label>
                            <Input
                                type="date"
                                placeholder="Available start date"
                                value={applicationData.available_start_date}
                                onChange={(e) => setApplicationData({
                                    ...applicationData,
                                    available_start_date: e.target.value
                                })}
                            />

                        </div>
                    </div>

                    <DialogFooter className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={handleCloseApplicationForm}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitApplication}
                            disabled={isSubmitting || !applicationData.first_name || !applicationData.last_name || !applicationData.email}
                        >
                            {isSubmitting ? "Submitting..." : "Submit Application"}
                            {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Success Message */}
            {applicationSubmitted && (
                <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Application submitted successfully!</span>
                </div>
            )}
        </div>
    );
}