import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  updateNotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  STORAGE_KEY_PREFERENCES,
} from '../services/notificationPreferences';
import { NotificationPreferences } from '../types/notification';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('notificationPreferences', () => {
  describe('getNotificationPreferences', () => {
    it('mengembalikan default preference ketika localStorage kosong', () => {
      const prefs = getNotificationPreferences();

      expect(prefs).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
    });

    it('mengembalikan preference dari localStorage ketika tersedia', () => {
      const customPrefs: NotificationPreferences = {
        messages: false,
        groups: false,
        sound: false,
      };
      localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(customPrefs));

      const prefs = getNotificationPreferences();

      expect(prefs.messages).toBe(false);
      expect(prefs.groups).toBe(false);
      expect(prefs.sound).toBe(false);
    });

    it('menggunakan nilai default ketika localStorage berisi data korup', () => {
      localStorage.setItem(STORAGE_KEY_PREFERENCES, 'invalid-json');

      const prefs = getNotificationPreferences();

      expect(prefs).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
    });

    it('menggunakan nilai default untuk field yang hilang di localStorage', () => {
      localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify({ messages: false }));

      const prefs = getNotificationPreferences();

      expect(prefs.messages).toBe(false);
      expect(prefs.groups).toBe(true);
      expect(prefs.sound).toBe(true);
    });

    it('mengabaikan field non-boolean dan menggunakan default', () => {
      localStorage.setItem(
        STORAGE_KEY_PREFERENCES,
        JSON.stringify({ messages: 'yes', groups: 0, sound: null })
      );

      const prefs = getNotificationPreferences();

      expect(prefs.messages).toBe(true);
      expect(prefs.groups).toBe(true);
      expect(prefs.sound).toBe(true);
    });
  });

  describe('saveNotificationPreferences', () => {
    it('menyimpan preference ke localStorage', () => {
      const prefs: NotificationPreferences = {
        messages: true,
        groups: false,
        sound: true,
      };

      const result = saveNotificationPreferences(prefs);

      expect(result).toEqual(prefs);
      expect(localStorage.getItem(STORAGE_KEY_PREFERENCES)).toBe(JSON.stringify(prefs));
    });

    it('mengubah semua field menjadi boolean sebelum menyimpan', () => {
      const prefs = saveNotificationPreferences({
        messages: 1 as unknown as boolean,
        groups: 'true' as unknown as boolean,
        sound: undefined as unknown as boolean,
      });

      expect(prefs.messages).toBe(true);
      expect(prefs.groups).toBe(true);
      expect(prefs.sound).toBe(false);
    });
  });

  describe('updateNotificationPreferences', () => {
    it('memperbarui hanya field yang diberikan dan mempertahankan yang lain', () => {
      saveNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES);

      const result = updateNotificationPreferences({ sound: false });

      expect(result.messages).toBe(true);
      expect(result.groups).toBe(true);
      expect(result.sound).toBe(false);
    });

    it('memperbarui beberapa field sekaligus', () => {
      saveNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES);

      const result = updateNotificationPreferences({ messages: false, groups: false });

      expect(result.messages).toBe(false);
      expect(result.groups).toBe(false);
      expect(result.sound).toBe(true);
    });
  });
});