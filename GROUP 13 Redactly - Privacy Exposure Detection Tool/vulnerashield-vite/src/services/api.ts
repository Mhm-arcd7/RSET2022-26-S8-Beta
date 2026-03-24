import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const mediaApi = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );
        console.log(`Upload Progress: ${percentCompleted}%`);
      },
    });
    return response.data;
  },

  analyze: async (fileId: string) => {
    const response = await api.post(`/api/analyze/${fileId}`);
    return response.data;
  },

  redact: async (fileId: string, operations: any[]) => {
    const response = await api.post(`/api/redact/${fileId}`, { operations });
    return response.data;
  },

  download: async (fileId: string) => {
    const response = await api.get(`/api/download/${fileId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/api/history');
    return response.data;
  },

  deleteFile: async (fileId: string) => {
    const response = await api.delete(`/api/files/${fileId}`);
    return response.data;
  },
};

export default api;

export {};