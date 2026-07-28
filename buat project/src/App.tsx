import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import NotificationsSettingsPage from './pages/settings/Notifications';
import NotificationCenterPage from './pages/NotificationCenter';
import NotificationBadge from './components/NotificationBadge';
import useNotificationSocket from './hooks/useNotificationSocket';
import { useMarkAsRead } from './hooks/useNotifications';
import { useEffect } from 'react';
import { Settings } from 'lucide-react';
import './App.css';

/**
 * AppContent is a child of QueryClientProvider (rendered in main.tsx),
 * which allows hooks here to access the React Query client.
 * useNotificationSocket is mounted once here so the listener lives
 * for the full application lifetime — a single registration, no duplicates.
 */
function AppContent() {
  useNotificationSocket();
  const navigate = useNavigate();
  const markAsReadMutation = useMarkAsRead();

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as {
        url: string;
        notificationId?: string;
      };
      navigate(detail.url);
      if (detail.notificationId) {
        markAsReadMutation.mutate(detail.notificationId);
      }
    };

    window.addEventListener('notification:click', handler as EventListener);
    return () => {
      window.removeEventListener('notification:click', handler as EventListener);
    };
  }, [navigate, markAsReadMutation]);

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-brand">
          <span className="brand-name">Notification System</span>
        </div>
        <nav className="header-nav">
          <NotificationBadge />
          <Link to="/settings/notifications" className="nav-link">
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/notifications" element={<NotificationCenterPage />} />
          <Route path="/settings/notifications" element={<NotificationsSettingsPage />} />
          {/* Redirect root / to /notifications */}
          <Route path="/" element={<Navigate to="/notifications" replace />} />
          <Route path="*" element={<Navigate to="/notifications" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
