import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/notificationApi';
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

/**
 * Custom React Query mutation hook for marking a single notification as read.
 * Optimistically updates the React Query cache and triggers PATCH /notifications/:id/read.
 */
export const useMarkAsRead = (): UseMutationResult<Notification, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation<Notification, Error, string, { previousNotifications?: Notification[] }>({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onMutate: async (id: string) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });

      // Snapshot the previous state
      const previousNotifications = queryClient.getQueryData<Notification[]>(NOTIFICATIONS_QUERY_KEY);

      // Optimistically update cache to change isRead to true immediately
      if (previousNotifications) {
        queryClient.setQueryData<Notification[]>(
          NOTIFICATIONS_QUERY_KEY,
          previousNotifications.map((item) =>
            item.id === id ? { ...item, isRead: true } : item
          )
        );
      }

      return { previousNotifications };
    },
    onError: (_err, _id, context) => {
      // Rollback to previous state if mutation fails
      if (context?.previousNotifications) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previousNotifications);
      }
    },
    onSettled: () => {
      // Invalidate query to keep in sync with server
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
};

/**
 * Custom React Query mutation hook for marking all notifications as read.
 * Optimistically updates the React Query cache for instant UI feedback.
 */
export const useMarkAllAsRead = (): UseMutationResult<void, Error, void> => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void, { previousNotifications?: Notification[] }>({
    mutationFn: () => markAllNotificationsAsRead(),
    onMutate: async () => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });

      // Snapshot the previous state for potential rollback
      const previousNotifications = queryClient.getQueryData<Notification[]>(NOTIFICATIONS_QUERY_KEY);

      // Optimistically mark all notifications as read in the cache
      if (previousNotifications) {
        queryClient.setQueryData<Notification[]>(
          NOTIFICATIONS_QUERY_KEY,
          previousNotifications.map((item) => ({ ...item, isRead: true }))
        );
      }

      return { previousNotifications };
    },
    onError: (_err, _vars, context) => {
      // Rollback to previous state if mutation fails
      if (context?.previousNotifications) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previousNotifications);
      }
    },
    onSettled: () => {
      // Invalidate query to keep in sync with server
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
};

export default useNotifications;
