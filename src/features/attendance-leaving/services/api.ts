// services/api.ts
import axios from 'axios';
const token = localStorage.getItem('token');
const API_BASE_URL = 'https://api-hris.slarenasitsolutions.com/public/api';

// Attendance API
export const attendanceAPI = {
  getAll: () => axios.get(`${API_BASE_URL}/attendances`, {
    headers: { Authorization: `Bearer ${token}` },
  }),
  create: (data: any) => axios.post(`${API_BASE_URL}/attendances`, data, {
    headers: { Authorization: `Bearer ${token}` },
  }),
  update: (id: string, data: any) => axios.put(`${API_BASE_URL}/attendances/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  }),
  delete: (id: string) => axios.delete(`${API_BASE_URL}/attendances/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  }),
};

// Leave API
export const leaveAPI = {
  getAll: () => axios.get(`${API_BASE_URL}/leaves`, {
    headers: { Authorization: `Bearer ${token}` },
  }),
  create: (data: any) => axios.post(`${API_BASE_URL}/leaves`, data, {
    headers: { Authorization: `Bearer ${token}` },
  }),
  update: (id: string, data: any) => axios.put(`${API_BASE_URL}/leaves/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  }),
  approve: (id: string) => axios.post(`${API_BASE_URL}/leaves/${id}/approve`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  }),
  reject: (id: string) => axios.post(`${API_BASE_URL}/leaves/${id}/reject`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  }),
  delete: (id: string) => axios.delete(`${API_BASE_URL}/leaves/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  }),
  getAllEmployeeLeaveBalances: (page = 1, perPage = 10) =>
    axios.get(`${API_BASE_URL}/leaves/employee`, {
      params: { page, per_page: perPage },
      headers: { Authorization: `Bearer ${token}` },
    }),
};
