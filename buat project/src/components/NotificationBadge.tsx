import React from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';

/**
 * Notification Badge component that displays unread count derived directly
 * from the React Query cache — automatically updates whenever the cache changes.
 */
const NotificationBadge: React.FC = () => {
  const { notifications } = useNotifications();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Link to="/notifications" className="nav-link notif-bell-link" title="Notification Center">
      <div className="notif-bell-wrapper">
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="notif-badge" aria-label={`${unreadCount} unread notifications`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
    </Link>
  );
};

export default NotificationBadge;
