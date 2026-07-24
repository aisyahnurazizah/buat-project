import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import NotificationsSettingsPage from './pages/settings/Notifications';
import { Bell, Settings } from 'lucide-react';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-layout">
        <header className="app-header">
          <div className="header-brand">
            <Bell size={24} className="brand-logo" />
            <span className="brand-name">Notification System</span>
          </div>
          <nav className="header-nav">
            <Link to="/settings/notifications" className="nav-link">
              <Settings size={18} />
              <span>Notification Settings</span>
            </Link>
          </nav>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/settings/notifications" element={<NotificationsSettingsPage />} />
            {/* Redirect root / to /settings/notifications */}
            <Route path="/" element={<Navigate to="/settings/notifications" replace />} />
            <Route path="*" element={<Navigate to="/settings/notifications" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
