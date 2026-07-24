import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket, connectSocket } from '../services/socket';
import { NOTIFICATIONS_QUERY_KEY } from './useNotifications';
import { Notification } from '../types/notification';

/**
 * useNotificationSocket
 *
 * Connects to the Socket.IO server and registers exactly ONE listener for the
 * `notification:new` event per hook instance.
 *
 * When a new notification arrives:
 *  1. The new item is prepended to the React Query cache for ['notifications'].
 *  2. NotificationCenter re-renders with the new item at the top.
 *  3. NotificationBadge re-renders with an incremented unread count.
 *
 * Cleanup:
 *  - The listener is removed before every re-render and on unmount using the
 *    stable `handlerRef` pattern — this guarantees no duplicate listeners
 *    even in React StrictMode (where effects fire twice in development).
 */
const useNotificationSocket = (): void => {
  const queryClient = useQueryClient();

  /**
   * Keep a stable reference to the handler function.
   * Using a ref means the `off()` call in cleanup always targets the exact
   * same function object that was passed to `on()`, preventing ghost listeners.
   */
  const handlerRef = useRef<(notification: Notification) => void>();

  useEffect(() => {
    const socket = connectSocket();

    // Define the handler and store it in the ref
    const handler = (notification: Notification) => {
      if (!notification || !notification.id) {
        console.warn('[Socket] Received malformed notification:new payload', notification);
        return;
      }

      queryClient.setQueryData<Notification[]>(
        NOTIFICATIONS_QUERY_KEY,
        (prev) => {
          const current = prev ?? [];

          // Guard against duplicates — a reconnect might re-deliver the same event
          const alreadyExists = current.some((item) => item.id === notification.id);
          if (alreadyExists) return current;

          // Prepend: newest notification appears first
          return [{ ...notification, isRead: false }, ...current];
        }
      );

      if (import.meta.env.DEV) {
        console.log('[Socket] notification:new received —', notification.id, notification.title);
      }
    };

    handlerRef.current = handler;

    // Register listener
    socket.on('notification:new', handler);

    return () => {
      // Remove exactly the handler we registered — no other listeners are touched
      socket.off('notification:new', handlerRef.current);
    };
  }, [queryClient]); // queryClient is stable (never changes), so this runs once
};

export default useNotificationSocket;
