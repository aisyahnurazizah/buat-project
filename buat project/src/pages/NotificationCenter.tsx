import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../hooks/useNotifications';
import type { Notification, NotificationType } from '../types/notification';
import {
  Bell,
  MessageSquare,
  Users,
  AtSign,
  UserPlus,
  AlertTriangle,
  RefreshCw,
  Inbox,
  MailCheck,
  CheckCircle,
  Loader2,
  WifiOff,
  X,
} from 'lucide-react';

/**
 * Returns a human-readable relative timestamp string.
 */
const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
};

/**
 * Renders an icon corresponding to the notification type.
 */
const NotificationTypeIcon: React.FC<{ type: NotificationType }> = ({ type }) => {
  switch (type) {
    case 'message':
      return <MessageSquare size={18} className="type-icon type-message" />;
    case 'group':
      return <Users size={18} className="type-icon type-group" />;
    case 'mention':
      return <AtSign size={18} className="type-icon type-mention" />;
    case 'friend_request':
      return <UserPlus size={18} className="type-icon type-friend" />;
    default:
      return <Bell size={18} className="type-icon type-default" />;
  }
};

export const NotificationCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, isLoading, isError, error, isEmpty, refetch } = useNotifications();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'warning' } | null>(null);

  // ── Socket connection status ──────────────────────────────────────────────
  const [socketConnected, setSocketConnected] = useState(true);

  useEffect(() => {
    const onDisconnect = () => setSocketConnected(false);
    const onReconnect = () => setSocketConnected(true);
    window.addEventListener('socket:disconnect', onDisconnect);
    window.addEventListener('socket:reconnect', onReconnect);
    return () => {
      window.removeEventListener('socket:disconnect', onDisconnect);
      window.removeEventListener('socket:reconnect', onReconnect);
    };
  }, []);

  // ── Toast auto-dismiss ────────────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  // ── User-friendly error message ───────────────────────────────────────────
  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error) {
      if (err.message === 'Network Error') {
        return 'Network error — please check your connection and try again.';
      }
      if (err.message.includes('401') || err.message.includes('403')) {
        return 'You are not authorized to perform this action.';
      }
      if (err.message.includes('404')) {
        return 'The requested resource was not found.';
      }
      if (err.message.includes('500') || err.message.includes('502') || err.message.includes('503')) {
        return 'Server error — please try again later.';
      }
      return err.message;
    }
    return 'An unexpected error occurred.';
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const hasUnread = notifications.some((n) => !n.isRead);

  const handleMarkAllAsRead = () => {
    if (hasUnread) {
      markAllAsReadMutation.mutate(undefined, {
        onError: (err) => {
          setToast({ message: getErrorMessage(err), type: 'error' });
        },
      });
    }
  };

  const handleItemClick = (item: Notification) => {
    if (!item.isRead) {
      markAsReadMutation.mutate(item.id, {
        onError: (err) => {
          setToast({ message: getErrorMessage(err), type: 'error' });
        },
      });
    }
    if (item.targetUrl) {
      navigate(item.targetUrl);
    }
  };

  const dismissToast = () => setToast(null);

  return (
    <div className="notification-center-container">
      {/* Header */}
      <div className="notification-center-header">
        <div className="header-title-group">
          <div className="header-icon-badge">
            <Bell size={24} />
          </div>
          <div>
            <h1>Notification Center</h1>
            <p className="header-subtitle">
              View and stay updated with your latest alerts and notifications.
            </p>
          </div>
        </div>

        <div className="header-actions">
          {hasUnread && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              title="Mark all notifications as read"
            >
              <MailCheck size={16} />
              <span>{markAllAsReadMutation.isPending ? 'Marking...' : 'Mark all as read'}</span>
            </button>
          )}
          <button
            type="button"
            className="btn-secondary"
            onClick={() => refetch()}
            title="Refresh notifications"
          >
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="notification-center-content">
        {/* Socket Connection Status */}
        {!socketConnected && (
          <div className="connection-status-bar">
            <WifiOff size={14} />
            <span>Connection lost — updates will resume when reconnected</span>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className={`toast toast-${toast.type}`}>
            <span>{toast.message}</span>
            <button type="button" className="toast-dismiss" onClick={dismissToast}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="notification-skeleton-list">
            <div className="loading-indicator">
              <Loader2 size={18} className="spin" />
              <span>Loading notifications...</span>
            </div>
            {[1, 2, 3].map((key) => (
              <div key={key} className="notification-skeleton-card">
                <div className="skeleton-avatar pulse" />
                <div className="skeleton-body">
                  <div className="skeleton-line skeleton-title pulse" />
                  <div className="skeleton-line skeleton-text pulse" />
                  <div className="skeleton-line skeleton-meta pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="state-card error-card">
            <AlertTriangle size={36} className="error-icon" />
            <h3>Failed to Load Notifications</h3>
            <p>{error ? getErrorMessage(error) : 'An error occurred while communicating with the server.'}</p>
            <button type="button" className="btn-primary" onClick={() => refetch()}>
              <RefreshCw size={16} />
              <span>Try Again</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {isEmpty && !isLoading && !isError && (
          <div className="state-card empty-card">
            <div className="empty-icon-wrapper">
              <Inbox size={40} />
            </div>
            <h3>No notifications yet</h3>
            <p>
              When you receive notifications, they&apos;ll appear here.
            </p>
          </div>
        )}

        {/* Success State: Notification List */}
        {!isLoading && !isError && !isEmpty && (
          <div className="notification-list">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`notification-item-card ${item.isRead ? 'read' : 'unread'}`}
                onClick={() => handleItemClick(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleItemClick(item);
                  }
                }}
              >
                {/* Unread Visual Indicator Dot */}
                {!item.isRead && <span className="unread-dot-indicator" title="Unread notification" />}

                {/* Type Icon */}
                <div className="type-icon-wrapper">
                  <NotificationTypeIcon type={item.type} />
                </div>

                {/* Content Body */}
                <div className="notification-content-body">
                  <div className="notification-title-row">
                    <h4 className="notification-item-title">{item.title}</h4>
                    <span className="type-pill">{item.type.replace('_', ' ')}</span>
                  </div>

                  <p className="notification-item-message">{item.message}</p>

                  <div className="notification-item-meta">
                    <span className="notification-timestamp">{formatRelativeTime(item.createdAt)}</span>
                    <div className="status-action-wrapper">
                      <span className={`status-tag ${item.isRead ? 'status-read' : 'status-unread'}`}>
                        {item.isRead ? 'Read' : 'Unread'}
                      </span>
                      {!item.isRead && (
                        <span className="mark-read-hint">
                          <CheckCircle size={12} /> Mark as read
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenterPage;
