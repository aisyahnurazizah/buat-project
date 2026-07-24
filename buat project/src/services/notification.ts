/**
 * Notification Service
 * Handles Service Worker registration, browser permission management,
 * and displaying local notifications.
 */

// Keep a local reference to the active Service Worker registration
let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Checks if the browser supports notifications and service workers.
 */
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

/**
 * Gets the current notification permission status.
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
};

/**
 * Requests permission from the user to show notifications.
 * @returns Promise resolving to the resulting NotificationPermission status.
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) {
    console.warn('Notifications are not supported in this browser.');
    return 'denied';
  }

  // Check if standard permission request is promise-based or uses a callback
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    // Fallback for older browsers
    return new Promise((resolve) => {
      Notification.requestPermission((permission) => {
        resolve(permission);
      });
    });
  }
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
    // Find the one that matches notification-sw.js
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

  // Ensure we try to fetch active registration if not cached
  const registration = await getActiveServiceWorkerRegistration();

  if (registration) {
    try {
      await registration.showNotification(title, options);
      return true;
    } catch (error) {
      console.warn('Failed to show notification via Service Worker, falling back to window Notification:', error);
    }
  }

  // Fallback to standard window Notification API
  try {
    const notification = new Notification(title, options);

    // Handle click interaction on fallback notifications
    if (options?.data?.url) {
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        window.location.href = options.data.url;
        notification.close();
      };
    }
    return true;
  } catch (error) {
    console.error('Failed to show standard notification:', error);
    return false;
  }
};
