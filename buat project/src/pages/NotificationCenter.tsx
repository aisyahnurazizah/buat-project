import React from 'react';
import { useNotifications, useMarkAsRead } from '../hooks/useNotifications';
import { NotificationType } from '../types/notification';
import {
  Bell,
  MessageSquare,
  Users,
  AtSign,
  UserPlus,
  AlertTriangle,
  RefreshCw,
  Inbox,
  CheckCircle,
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
  const { notifications, isLoading, isError, error, isEmpty, refetch } = useNotifications();
  const markAsReadMutation = useMarkAsRead();

  const handleItemClick = (id: string, isRead: boolean) => {
    if (!isRead) {
      markAsReadMutation.mutate(id);
    }
  };

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

      <div className="notification-center-content">
        {/* Loading State */}
        {isLoading && (
          <div className="notification-skeleton-list">
            {[1, 2, 3, 4].map((key) => (
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
            <p>{error?.message || 'An error occurred while communicating with the server.'}</p>
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
            <h3>No Notifications Found</h3>
            <p>You are all caught up! New notifications will appear here when they arrive.</p>
          </div>
        )}

        {/* Success State: Notification List */}
        {!isLoading && !isError && !isEmpty && (
          <div className="notification-list">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`notification-item-card ${item.isRead ? 'read' : 'unread'}`}
                onClick={() => handleItemClick(item.id, item.isRead)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleItemClick(item.id, item.isRead);
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
