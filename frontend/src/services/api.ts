import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

// Define the standard API response structure from the backend
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
}

// Define the error response structure
export interface ApiError {
  success: false;
  statusCode: number;
  timestamp: string;
  path: string;
  error: {
    message: string | string[];
    [key: string]: unknown;
  };
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token etc.
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for handling the success/data wrapper and errors
api.interceptors.response.use(
  (response) => {
    // Return only the data part of the backend's { success: true, data: T } wrapper
    return response.data.data;
  },
  (error: AxiosError<ApiError>) => {
    // Standardize error handling
    const apiError = error.response?.data;
    const message = apiError?.error?.message || error.message || 'An unexpected error occurred';

    // You could add a notification/toast system call here
    console.error(`[API Error] ${message}`, apiError);

    // If it's a 401 Unauthorized, we might want to logout the user
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      // window.location.href = '/login'; // Or use a router to redirect
    }

    return Promise.reject(error);
  },
);

export default api;
