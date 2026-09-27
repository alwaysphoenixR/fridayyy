import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { RefreshSuccessResponse, TokenExpiredResponse } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial for refresh token cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach access token if available in memory
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor to handle 401 token expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Check if error is 401 and specific to Token expired
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const data = error.response.data as TokenExpiredResponse;
      
      if (data?.message === 'Token expired' || data?.message === 'No token provided' || data?.expired) {
        originalRequest._retry = true;
        
        try {
          // Attempt to refresh the token using the HttpOnly cookie
          const refreshResponse = await axios.post<RefreshSuccessResponse>(
            `${API_BASE_URL}/auth/refresh-token`,
            {},
            { withCredentials: true }
          );
          
          setAccessToken(refreshResponse.data.accessToken);
          
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
          }
          
          // Retry original request
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh token also failed/expired, user must login again
          setAccessToken(null);
          // Optional: trigger a global event or redirect to login here
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);
