import api from '@/utils/axios';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface JobPosting {
    id: string;
    title: string;
    department_id: string;
    department?: {
        id: string;
        department_name: string;
        description?: string;
    };
    location: string;
    work_type: string;
    employment_type: string;
    salary_range: string;
    description: string;
    status: 'draft' | 'active' | 'closed';
    posted_date: string;
    deadline_date: string;
    is_archived: boolean;
    created_at?: string;
    updated_at?: string;
    applications_count?: number;
}

export interface CreateJobPostingRequest {
    title: string;
    department_id: string;
    work_type: string;
    employment_type: string;
    location?: string;
    salary_range?: string;
    description?: string;
    status?: 'draft' | 'active' | 'closed';
    posted_date?: string;
    deadline_date?: string;
}

export interface UpdateJobPostingRequest extends Partial<CreateJobPostingRequest> { }

export interface JobPostingResponse {
    isSuccess: boolean;
    message: string;
    data?: JobPosting;
    job_postings?: JobPosting[];
    pagination?: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
}

export interface JobPostingFilters {
    search?: string;
    department_id?: string;
    status?: string;
    per_page?: number;
    page?: number;
}

// Job Posting API (authenticated via shared client + per-request token)
export const jobPostingAPI = {
    // Get all job postings with optional filters
    getAll: (params?: JobPostingFilters) =>
        api.get<JobPostingResponse>(`/job-postings`, { params, headers: getAuthHeaders() }),

    // Create a new job posting
    create: (data: CreateJobPostingRequest) =>
        api.post<JobPostingResponse>(`/create/job-postings`, data, { headers: getAuthHeaders() }),

    // Update a job posting
    update: (id: string, data: UpdateJobPostingRequest) =>
        api.post<JobPostingResponse>(`/update/job-postings/${id}`, data, { headers: getAuthHeaders() }),

    // Archive a job posting
    archive: (id: string) =>
        api.post<JobPostingResponse>(`/archive/job-postings/${id}`, {}, { headers: getAuthHeaders() }),
};
