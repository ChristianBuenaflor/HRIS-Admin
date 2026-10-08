// services/api.ts
import api from '@/utils/axios';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Attendance API (token read per request; uses shared client with interceptor)
export const attendanceAPI = {
  getAll: () => api.get(`/attendances`, { headers: getAuthHeaders() }),
  create: (data: any) => api.post(`/attendances`, data, { headers: getAuthHeaders() }),
  update: (id: string, data: any) => api.put(`/attendances/${id}`, data, { headers: getAuthHeaders() }),
  delete: (id: string) => api.delete(`/attendances/${id}`, { headers: getAuthHeaders() }),
};

// Leave API
export const leaveAPI = {
  getAll: () => api.get(`/leaves`, { headers: getAuthHeaders() }),
  create: (data: any) => api.post(`/leaves`, data, { headers: getAuthHeaders() }),
  update: (id: string, data: any) => api.put(`/leaves/${id}`, data, { headers: getAuthHeaders() }),
  approve: (id: string) => api.post(`/leaves/${id}/approve`, {}, { headers: getAuthHeaders() }),
  reject: (id: string) => api.post(`/leaves/${id}/reject`, {}, { headers: getAuthHeaders() }),
  delete: (id: string) => api.delete(`/leaves/${id}`, { headers: getAuthHeaders() }),
  getAllEmployeeLeaveBalances: (page = 1, perPage = 10) =>
    api.get(`/leaves/employee`, {
      params: { page, per_page: perPage },
      headers: getAuthHeaders(),
    }),
};

// Overtime API (Admin)
export const overtimeAPI = {
  getAll: (params?: { status?: string; employee_id?: number | string; page?: number; per_page?: number }) =>
    api.get(`/overtime/requests`, {
      params,
      headers: getAuthHeaders(),
    }),
  approve: (id: number | string) =>
    api.post(`/overtime/${id}/approve`, {}, {
      headers: getAuthHeaders(),
    }),
  reject: (id: number | string, rejection_reason: string) =>
    api.post(`/overtime/${id}/reject`, { rejection_reason }, {
      headers: getAuthHeaders(),
    }),
};
