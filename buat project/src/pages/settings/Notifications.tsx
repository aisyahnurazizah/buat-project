import React, { useEffect, useState } from 'react';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  getNotificationPermissionState,
  handlePermissionRequest,
  subscribePermissionChange,
  type NotificationPermissionState,
  type NotificationPreferences,
} from '../../services/notification';
import {
  Bell,
  Volume2,
  MessageSquare,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield,
} from 'lucide-react';

export const NotificationsSettingsPage: React.FC = () => {
  // State for user notification preferences (messages, groups, sound)
  const [preferences, setPreferences] = useState<NotificationPreferences>(() =>
    getNotificationPreferences()
  );

  // State for browser desktop notification permission status
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>(() =>
    getNotificationPermissionState()
  );

  // Loading state for permission request button
  const [isRequesting, setIsRequesting] = useState(false);

  // Listen for browser notification permission changes (e.g. via site settings)
  useEffect(() => {
    const unsubscribe = subscribePermissionChange((newState) => {
      setPermissionState(newState);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Handle preference toggle change
  const handleToggle = (key: keyof NotificationPreferences) => {
    const newValue = !preferences[key];
    const updated = updateNotificationPreferences({ [key]: newValue });
    setPreferences(updated);
  };

  // Handle browser permission request
  const onRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const newState = await handlePermissionRequest();
      setPermissionState(newState);
    } catch (error) {
      console.error('Failed to request permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div className="settings-title-group">
          <div className="header-icon-badge">
            <Bell size={24} />
          </div>
          <div>
            <h1>Notification Settings</h1>
            <p className="settings-subtitle">
              Manage your message, group, sound, and desktop browser notifications.
            </p>
          </div>
        </div>
      </div>

      <div className="settings-content">
        {/* Desktop Notification Permission Section */}
        <section className="settings-card">
          <div className="card-header">
            <Shield className="card-icon" size={20} />
            <h2>Desktop Notification Permission</h2>
          </div>
          <p className="card-description">
            Allow your browser to display push notifications on your desktop even when the tab is in the background.
          </p>

          <div className="permission-status-box">
            <div className="status-info">
              {permissionState.isGranted && (
                <>
                  <CheckCircle2 className="status-icon status-granted" size={24} />
                  <div>
                    <div className="status-title">Permission Granted</div>
                    <div className="status-desc">
                      Desktop notifications are active and ready to deliver alerts.
                    </div>
                  </div>
                </>
              )}

              {permissionState.isDenied && (
                <>
                  <XCircle className="status-icon status-denied" size={24} />
                  <div>
                    <div className="status-title">Permission Blocked</div>
                    <div className="status-desc">
                      Notifications are blocked in your browser settings. Please enable them in your browser site settings.
                    </div>
                  </div>
                </>
              )}

              {permissionState.isDefault && (
                <>
                  <AlertCircle className="status-icon status-default" size={24} />
                  <div>
                    <div className="status-title">Permission Not Configured</div>
                    <div className="status-desc">
                      Permission has not been requested yet. Click the button below to enable desktop notifications.
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="status-action">
              {permissionState.isDefault && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={onRequestPermission}
                  disabled={isRequesting}
                >
                  {isRequesting ? 'Requesting...' : 'Enable Desktop Notifications'}
                </button>
              )}

              {permissionState.isGranted && (
                <span className="badge badge-success">Active</span>
              )}

              {permissionState.isDenied && (
                <span className="badge badge-danger">Blocked</span>
              )}
            </div>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="settings-card">
          <div className="card-header">
            <Bell className="card-icon" size={20} />
            <h2>Notification Preferences</h2>
          </div>
          <p className="card-description">
            Customize which types of notifications you want to receive and how they behave.
          </p>

          <div className="preference-list">
            {/* Message Notifications Toggle */}
            <div className="preference-item">
              <div className="preference-label-group">
                <div className="pref-icon-wrapper">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <div className="pref-title">Message Notifications</div>
                  <div className="pref-subtitle">
                    Receive notification alerts when direct messages are received.
                  </div>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={preferences.messages}
                  onChange={() => handleToggle('messages')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {/* Group Notifications Toggle */}
            <div className="preference-item">
              <div className="preference-label-group">
                <div className="pref-icon-wrapper">
                  <Users size={18} />
                </div>
                <div>
                  <div className="pref-title">Group Notifications</div>
                  <div className="pref-subtitle">
                    Receive notification alerts for group activities and mentions.
                  </div>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={preferences.groups}
                  onChange={() => handleToggle('groups')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {/* Sound Notifications Toggle */}
            <div className="preference-item">
              <div className="preference-label-group">
                <div className="pref-icon-wrapper">
                  <Volume2 size={18} />
                </div>
                <div>
                  <div className="pref-title">Sound Notifications</div>
                  <div className="pref-subtitle">
                    Play an auditory chime whenever a new notification arrives.
                  </div>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={preferences.sound}
                  onChange={() => handleToggle('sound')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default NotificationsSettingsPage;
