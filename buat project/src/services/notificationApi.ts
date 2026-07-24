import apiClient from './apiClient';
import { Notification } from '../types/notification';

/**
 * Interface representing a wrapped API response for notifications list.
 */
export interface NotificationsApiResponse {
  data: Notification[];
  message?: string;
  status?: number;
}

/**
 * Fetches the list of notifications from the backend API endpoint (GET /notifications).
 * 
 * @returns Promise resolving to an array of Notification items.
 */
export const getNotifications = async (): Promise<Notification[]> => {
  const response = await apiClient.get<Notification[] | NotificationsApiResponse>('/notifications');

  // Handle direct array response format
  if (Array.isArray(response.data)) {
    return response.data;
  }

  // Handle wrapped response format { data: [...] }
  if (response.data && Array.isArray((response.data as NotificationsApiResponse).data)) {
    return (response.data as NotificationsApiResponse).data;
  }

  return [];
};
