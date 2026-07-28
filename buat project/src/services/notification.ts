/**
 * Notification Service
 * Handles Service Worker registration, browser permission management,
 * displaying local notifications, and user notification preferences.
 */

import { getNotificationPreferences } from './notificationPreferences';

export * from '../types/notification';
export * from './notificationPreferences';
export * from './notificationApi';


// Keep a local reference to the active Service Worker registration
let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Interface representing the comprehensive status of browser notification permissions.
 * Designed for easy consumption by Notification Settings UI.
 */
export interface NotificationPermissionState {
  permission: NotificationPermission; // 'granted' | 'denied' | 'default'
  isSupported: boolean;
  isGranted: boolean;
  isDenied: boolean;
  isDefault: boolean;
  canRequest: boolean;
}

/**
 * Checks if the browser supports notifications and service workers.
 */
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

/**
 * Gets the current notification permission status ('granted', 'denied', or 'default').
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
};

/**
 * Gets a structured permission state summary for Notification Settings.
 */
export const getNotificationPermissionState = (): NotificationPermissionState => {
  const supported = isNotificationSupported();
  const permission = getNotificationPermission();

  return {
    permission,
    isSupported: supported,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    isDefault: permission === 'default',
    canRequest: supported && permission === 'default',
  };
};

/**
 * Requests permission from the user to show notifications using Notification.requestPermission().
 * Handles 'granted', 'denied', and 'default' responses.
 * 
 * @returns Promise resolving to the resulting NotificationPermission status.
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) {
    console.warn('Notifications are not supported in this browser.');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    // Fallback for older browsers that use callback syntax
    return new Promise((resolve) => {
      Notification.requestPermission((permission) => {
        resolve(permission);
      });
    });
  }
};

/**
 * Main action function for Notification Settings UI.
 * Requests notification permission from the user and automatically registers the Service Worker if granted.
 * Explicitly handles 'granted', 'denied', and 'default' statuses.
 * 
 * @returns Promise resolving to the updated NotificationPermissionState.
 */
export const handlePermissionRequest = async (): Promise<NotificationPermissionState> => {
  const permission = await requestNotificationPermission();

  if (permission === 'granted') {
    await registerServiceWorker();
  }

  return getNotificationPermissionState();
};

/**
 * Subscribes to browser notification permission changes (e.g. when user changes settings in browser address bar).
 * 
 * @param onChange Callback triggered when permission status changes.
 * @returns Unsubscribe function to clean up listener.
 */
export const subscribePermissionChange = (
  onChange: (state: NotificationPermissionState) => void
): (() => void) => {
  if (!('permissions' in navigator)) {
    return () => {};
  }

  let permissionStatus: PermissionStatus | null = null;

  const handleChange = () => {
    onChange(getNotificationPermissionState());
  };

  navigator.permissions
    .query({ name: 'notifications' as PermissionName })
    .then((status) => {
      permissionStatus = status;
      permissionStatus.addEventListener('change', handleChange);
    })
    .catch((error) => {
      console.warn('Permissions API query for notifications failed:', error);
    });

  return () => {
    if (permissionStatus) {
      permissionStatus.removeEventListener('change', handleChange);
    }
  };
};

/**
 * Registers the service worker to handle background notifications.
 * @returns Promise resolving to the ServiceWorkerRegistration or null if failed/not supported.
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isNotificationSupported()) {
    console.warn('Service Worker or Notifications not supported.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/notification-sw.js');
    swRegistration = registration;
    console.log('Service Worker registered successfully with scope:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

/**
 * Helper to retrieve an active service worker registration.
 */
export const getActiveServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isNotificationSupported()) {
    return null;
  }

  if (swRegistration) {
    return swRegistration;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const match = registrations.find(reg => reg.active && reg.active.scriptURL.includes('notification-sw.js'));
    if (match) {
      swRegistration = match;
      return match;
    }
  } catch (error) {
    console.error('Failed to get active Service Worker registration:', error);
  }

  return null;
};

/**
 * Displays a local browser notification.
 * Attempts to display it via Service Worker if registered, falling back to standard Notification API.
 * 
 * @param title The title of the notification.
 * @param options Configuration options for the notification.
 * @returns Promise resolving to true if shown, false otherwise.
 */
export const showLocalNotification = async (
  title: string,
  options?: NotificationOptions
): Promise<boolean> => {
  if (!isNotificationSupported()) {
    console.warn('Notifications are not supported in this browser.');
    return false;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission is not granted.');
    return false;
  }

  const registration = await getActiveServiceWorkerRegistration();

  if (registration) {
    try {
      await registration.showNotification(title, options);
      return true;
    } catch (error) {
      console.warn('Failed to show notification via Service Worker, falling back to window Notification:', error);
    }
  }

  try {
    const notification = new Notification(title, options);

    if (options?.data?.url) {
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        window.dispatchEvent(
          new CustomEvent('notification:click', {
            detail: {
              url: options.data.url,
              notificationId: options.data.notificationId,
            },
          })
        );
        notification.close();
      };
    }
    return true;
  } catch (error) {
    console.error('Failed to show standard notification:', error);
    return false;
  }
};

/**
 * Plays the notification sound if sound preference is enabled.
 * Handles browser autoplay restrictions gracefully by catching
 * play() rejections silently.
 */
export const playNotificationSound = (): void => {
  const preferences = getNotificationPreferences();
  if (!preferences.sound) {
    return;
  }

  try {
    const audio = new Audio('/notification-sound.wav');
    audio.play().catch(() => {
      // Autoplay policy prevented playback — expected when no user
      // gesture has occurred yet. Subsequent notifications after
      // user interaction will succeed automatically.
    });
  } catch (error) {
    console.warn('Failed to play notification sound:', error);
  }
};
