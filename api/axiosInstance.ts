// api/axiosInstance.ts
import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { auth } from '../config/firebaseConfig';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: 'https://dummyjson.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const user = auth.currentUser;
      
      if (user) {
        config.headers['X-User-ID'] = user.uid;
        
        const token = await user.getIdToken();
        config.headers['Authorization'] = `Bearer ${token}`;
        
        console.log('API Request with UID:', user.uid);
      } else {
        console.log('No user logged in for API request');
      }
    } catch (error) {
      console.error('Error getting user for API request:', error);
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.log('Unauthorized - redirecting to login');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;