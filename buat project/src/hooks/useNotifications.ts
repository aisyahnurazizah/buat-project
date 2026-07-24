import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getNotifications } from '../services/notificationApi';
import { Notification } from '../types/notification';

/**
 * Query key for notification list caching and invalidation.
 */
export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;

/**
 * Return type interface for useNotifications custom hook.
 */
export interface UseNotificationsResult {
  notifications: Notification[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isSuccess: boolean;
  isEmpty: boolean;
  refetch: () => void;
  queryResult: UseQueryResult<Notification[], Error>;
}

/**
 * Custom React hook for fetching and managing notification data using TanStack React Query.
 * 
 * Uses queryKey ["notifications"] and calls getNotifications().
 * Handles loading, error, success, and empty states.
 */
export const useNotifications = (): UseNotificationsResult => {
  const queryResult = useQuery<Notification[], Error>({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: getNotifications,
  });

  const notifications = queryResult.data ?? [];
  const isEmpty = queryResult.isSuccess && notifications.length === 0;

  return {
    notifications,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    isSuccess: queryResult.isSuccess,
    isEmpty,
    refetch: queryResult.refetch,
    queryResult,
  };
};

export default useNotifications;
