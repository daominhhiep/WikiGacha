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
    // Retrieve token from Zustand's persisted storage
    const storageStr = localStorage.getItem('wikigacha-auth-storage');
    let token = null;

    if (storageStr) {
      try {
        const storage = JSON.parse(storageStr);
        token = storage.state?.accessToken;
      } catch (e) {
        console.error('Failed to parse auth storage', e);
      }
    }

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

    console.error(`[API Error] ${message}`, apiError);

    // If it's a 401 Unauthorized, we might want to clear the storage
    if (error.response?.status === 401) {
      localStorage.removeItem('wikigacha-auth-storage');
      // Redirect to home or reload to clear state
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  },
);

export default api;
