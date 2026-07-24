import { NotificationPreferences } from '../types/notification';

export const STORAGE_KEY_PREFERENCES = 'notification_preferences';

/**
 * Safe default notification preferences.
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  messages: true,
  groups: true,
  sound: true,
};

/**
 * Retrieves the current notification preferences from LocalStorage.
 * Uses safe default values if LocalStorage is empty or corrupted.
 */
export const getNotificationPreferences = (): NotificationPreferences => {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY_PREFERENCES);
    if (!rawData) {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    }

    const parsed = JSON.parse(rawData);
    return {
      messages: typeof parsed.messages === 'boolean' ? parsed.messages : DEFAULT_NOTIFICATION_PREFERENCES.messages,
      groups: typeof parsed.groups === 'boolean' ? parsed.groups : DEFAULT_NOTIFICATION_PREFERENCES.groups,
      sound: typeof parsed.sound === 'boolean' ? parsed.sound : DEFAULT_NOTIFICATION_PREFERENCES.sound,
    };
  } catch (error) {
    console.warn('Failed to read notification preferences from localStorage. Using defaults.', error);
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
};

/**
 * Saves complete notification preferences to LocalStorage.
 * 
 * @param preferences The full notification preferences object to save.
 * @returns The saved notification preferences.
 */
export const saveNotificationPreferences = (
  preferences: NotificationPreferences
): NotificationPreferences => {
  try {
    const sanitized: NotificationPreferences = {
      messages: Boolean(preferences.messages),
      groups: Boolean(preferences.groups),
      sound: Boolean(preferences.sound),
    };
    localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(sanitized));
    return sanitized;
  } catch (error) {
    console.error('Failed to save notification preferences to localStorage:', error);
    return preferences;
  }
};

/**
 * Updates partial notification preferences and saves them to LocalStorage.
 * 
 * @param partialPreferences Partial preferences object containing only keys to update.
 * @returns The updated complete notification preferences.
 */
export const updateNotificationPreferences = (
  partialPreferences: Partial<NotificationPreferences>
): NotificationPreferences => {
  const currentPreferences = getNotificationPreferences();
  const updatedPreferences: NotificationPreferences = {
    ...currentPreferences,
    ...partialPreferences,
  };
  return saveNotificationPreferences(updatedPreferences);
};
