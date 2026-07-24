import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import NotificationsSettingsPage from './pages/settings/Notifications';
import NotificationCenterPage from './pages/NotificationCenter';
import NotificationBadge from './components/NotificationBadge';
import { Settings } from 'lucide-react';
import './App.css';

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;
