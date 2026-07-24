import axios from 'axios';

/**
 * Shared Axios instance for making API requests across the application.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
