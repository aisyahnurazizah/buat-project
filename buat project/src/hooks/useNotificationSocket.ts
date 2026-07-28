import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket, isSocketConnected } from '../services/socket';
import { NOTIFICATIONS_QUERY_KEY } from './useNotifications';
import { Notification } from '../types/notification';
import {
  getNotificationPermission,
  showLocalNotification,
  playNotificationSound,
} from '../services/notification';
import { getNotificationPreferences } from '../services/notificationPreferences';

/**
 * Maps a notification type to the relevant user preference key.
 * Returns null when the type has no preference toggle (e.g. 'friend_request')
 * and should always show if permission is granted.
 */
const resolvePreferenceKey = (
  type: Notification['type']
): 'messages' | 'groups' | null => {
  switch (type) {
    case 'message':
    case 'mention':
      return 'messages';
    case 'group':
      return 'groups';
    default:
      return null; // Show unconditionally for unknown/system types
  }
};

/**
 * Decides whether a browser notification should be shown for an incoming
 * notification payload, based on:
 *  1. Browser permission (must be 'granted')
 *  2. User preference for this notification type
 */
const shouldShowBrowserNotification = (notification: Notification): boolean => {
  // 1. Permission gate — never show if denied
  if (getNotificationPermission() !== 'granted') {
    return false;
  }

  // 2. Preference gate — read current preferences (always fresh from localStorage)
  const preferences = getNotificationPreferences();
  const prefKey = resolvePreferenceKey(notification.type);

  if (prefKey !== null && !preferences[prefKey]) {
    return false;
  }

  return true;
};

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
 *  4. A Browser Notification is shown if permission is granted and
 *     the user's type preference allows it.
 *
 * Cleanup:
 *  - The listener is removed before every re-render and on unmount using the
 *    stable `handlerRef` pattern — this guarantees no duplicate listeners
 *    even in React StrictMode (where effects fire twice in development).
 */
const useNotificationSocket = (): void => {
  const queryClient = useQueryClient();
  const connectedRef = useRef(isSocketConnected());

  /**
   * Keep a stable reference to the handler function.
   * Using a ref means the `off()` call in cleanup always targets the exact
   * same function object that was passed to `on()`, preventing ghost listeners.
   */
  const handlerRef = useRef<(notification: Notification) => void>();

  useEffect(() => {
    const socket = connectSocket();

    const handler = async (notification: Notification) => {
      // ── Validation ──────────────────────────────────────────────────
      if (!notification || !notification.id) {
        console.warn('[Socket] Received malformed notification:new payload', notification);
        return;
      }

      // ── Step 1: Update React Query cache ────────────────────────────
      let isDuplicate = false;

      try {
        queryClient.setQueryData<Notification[]>(
          NOTIFICATIONS_QUERY_KEY,
          (prev) => {
            const current = prev ?? [];

            // Guard against duplicates — a reconnect might re-deliver the same event
            if (current.some((item) => item.id === notification.id)) {
              isDuplicate = true;
              return current;
            }

            // Prepend: newest notification appears first
            return [{ ...notification, isRead: false }, ...current];
          }
        );
      } catch (error) {
        console.error('[Socket] Failed to update notification cache:', error);
        return;
      }

      // Don't show a browser notification for an event we've already processed
      if (isDuplicate) {
        if (import.meta.env.DEV) {
          console.log('[Socket] Skipped duplicate notification:new —', notification.id);
        }
        return;
      }

      if (import.meta.env.DEV) {
        console.log('[Socket] notification:new received —', notification.id, notification.title);
      }

      // ── Step 2: Browser Notification ────────────────────────────────────────
      // Check permission and user preferences before showing
      if (shouldShowBrowserNotification(notification)) {
        try {
          const shown = await showLocalNotification(notification.title, {
            body: notification.message,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            tag: `notification-${notification.id}`,
            data: {
              url: notification.targetUrl ?? '/notifications',
              notificationId: notification.id,
            },
          });

          if (!shown && import.meta.env.DEV) {
            console.warn('[Socket] Browser notification failed to show —', notification.id);
          }
        } catch (error) {
          console.error('[Socket] Unexpected error showing browser notification:', error);
        }
      }

      // ── Step 3: Notification Sound ──────────────────────────────────────────
      // Play sound if the user has sound preference enabled.
      // playNotificationSound() handles autoplay restrictions internally
      // by catching play() rejections silently.
      try {
        playNotificationSound();
      } catch (error) {
        console.warn('[Socket] Failed to play notification sound:', error);
      }
    };

    handlerRef.current = handler;

    // Register listener
    socket.on('notification:new', handler);

    // Listen for socket connection state changes and notify the app via DOM events
    const handleDisconnect = () => {
      connectedRef.current = false;
      window.dispatchEvent(new CustomEvent('socket:disconnect'));
    };

    const handleReconnect = () => {
      connectedRef.current = true;
      window.dispatchEvent(new CustomEvent('socket:reconnect'));
    };

    const handleConnectError = () => {
      connectedRef.current = false;
      window.dispatchEvent(new CustomEvent('socket:disconnect'));
    };

    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect', handleReconnect);
    socket.on('connect_error', handleConnectError);

    return () => {
      // Remove exactly the handler we registered — no other listeners are touched
      socket.off('notification:new', handlerRef.current);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect', handleReconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, [queryClient]); // queryClient is stable (never changes), so this runs once
};

export default useNotificationSocket;
