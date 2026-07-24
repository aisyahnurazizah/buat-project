import apiClient from './apiClient';
import { Notification } from '../types/notification';

/**
 * Interface representing a wrapped API response for notifications.
 */
export interface NotificationsApiResponse {
  data: Notification[] | Notification;
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
    return (response.data as NotificationsApiResponse).data as Notification[];
  }

  return [];
};

/**
 * Marks a single notification as read via backend API endpoint (PATCH /notifications/:id/read).
 * 
 * @param id Notification ID to mark as read.
 * @returns Promise resolving to the updated Notification item.
 */
export const markNotificationAsRead = async (id: string): Promise<Notification> => {
  const response = await apiClient.patch<Notification | NotificationsApiResponse>(`/notifications/${id}/read`);

  if (response.data && 'id' in response.data) {
    return response.data as Notification;
  }

  if (response.data && 'data' in response.data) {
    const dataContent = (response.data as NotificationsApiResponse).data;
    if (Array.isArray(dataContent)) {
      return dataContent[0];
    }
    return dataContent as Notification;
  }

  return {
    id,
    type: 'message',
    title: '',
    message: '',
    isRead: true,
    createdAt: new Date().toISOString(),
  };
};
