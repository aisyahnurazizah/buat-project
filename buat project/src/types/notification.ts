/**
 * Notification System Type Definitions
 */

/**
 * Supported notification category types.
 */
export type NotificationType = 'message' | 'group' | 'mention' | 'friend_request';

/**
 * Interface representing a single Notification entity.
 */
export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  targetUrl?: string;
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Type alias for Notification entity.
 */
export type Notification = NotificationItem;

/**
 * User notification preferences schema.
 */
export interface NotificationPreferences {
  messages: boolean;
  groups: boolean;
  sound: boolean;
}
