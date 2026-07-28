import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationCenterPage } from '../pages/NotificationCenter';
import * as hooks from '../hooks/useNotifications';
import type { Notification } from '../types/notification';

vi.mock('../hooks/useNotifications');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const mockedUseNotifications = vi.mocked(hooks.useNotifications);
const mockedUseMarkAsRead = vi.mocked(hooks.useMarkAsRead);
const mockedUseMarkAllAsRead = vi.mocked(hooks.useMarkAllAsRead);

const mockRefetch = vi.fn();

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'message',
    title: 'New Message',
    message: 'Hello from John',
    isRead: false,
    createdAt: new Date().toISOString(),
    targetUrl: '/messages/123',
  },
  {
    id: '2',
    type: 'group',
    title: 'Group Update',
    message: 'New message in Team Chat',
    isRead: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const defaultMocks = () => {
  mockedUseMarkAsRead.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
    isSuccess: false,
    data: null,
  } as unknown as ReturnType<typeof hooks.useMarkAsRead>);
  mockedUseMarkAllAsRead.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
    isSuccess: false,
    data: null,
  } as unknown as ReturnType<typeof hooks.useMarkAllAsRead>);
};

beforeEach(() => {
  vi.clearAllMocks();
  defaultMocks();
});

afterEach(() => {
  vi.resetAllMocks();
});

describe('NotificationCenterPage', () => {
  describe('Loading State', () => {
    it('tampilkan loading skeleton ketika data sedang dimuat', () => {
      mockedUseNotifications.mockReturnValue({
        notifications: [],
        isLoading: true,
        isError: false,
        error: null,
        isSuccess: false,
        isEmpty: false,
        refetch: mockRefetch,
        queryResult: {
          data: [],
          isLoading: true,
          isError: false,
          error: null,
          isSuccess: false,
          isEmpty: false,
          refetch: mockRefetch,
        },
      } as unknown as ReturnType<typeof hooks.useNotifications>);

      render(<NotificationCenterPage />);

      expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('tampilkan empty state ketika tidak ada notification', () => {
      mockedUseNotifications.mockReturnValue({
        notifications: [],
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
        isEmpty: true,
        refetch: mockRefetch,
        queryResult: {
          data: [],
          isLoading: false,
          isError: false,
          error: null,
          isSuccess: true,
          isEmpty: true,
          refetch: mockRefetch,
        },
      } as unknown as ReturnType<typeof hooks.useNotifications>);

      render(<NotificationCenterPage />);

      expect(screen.getByText('No notifications yet')).toBeInTheDocument();
    });
  });

  describe('Notification List', () => {
    it('tampilkan daftar notification ketika data tersedia', () => {
      mockedUseNotifications.mockReturnValue({
        notifications: mockNotifications,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
        isEmpty: false,
        refetch: mockRefetch,
        queryResult: {
          data: mockNotifications,
          isLoading: false,
          isError: false,
          error: null,
          isSuccess: true,
          isEmpty: false,
          refetch: mockRefetch,
        },
      } as unknown as ReturnType<typeof hooks.useNotifications>);

      render(<NotificationCenterPage />);

      expect(screen.getByText('New Message')).toBeInTheDocument();
      expect(screen.getByText('Group Update')).toBeInTheDocument();
    });

    it('unread notification memiliki dot indicator', () => {
      mockedUseNotifications.mockReturnValue({
        notifications: mockNotifications,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
        isEmpty: false,
        refetch: mockRefetch,
        queryResult: {
          data: mockNotifications,
          isLoading: false,
          isError: false,
          error: null,
          isSuccess: true,
          isEmpty: false,
          refetch: mockRefetch,
        },
      } as unknown as ReturnType<typeof hooks.useNotifications>);

      render(<NotificationCenterPage />);

      expect(document.querySelector('.unread-dot-indicator')).toBeTruthy();
    });

    it('read notification tidak memiliki dot indicator', () => {
      const readOnly = mockNotifications.filter((n) => n.isRead);
      mockedUseNotifications.mockReturnValue({
        notifications: readOnly,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
        isEmpty: false,
        refetch: mockRefetch,
        queryResult: {
          data: readOnly,
          isLoading: false,
          isError: false,
          error: null,
          isSuccess: true,
          isEmpty: false,
          refetch: mockRefetch,
        },
      } as unknown as ReturnType<typeof hooks.useNotifications>);

      render(<NotificationCenterPage />);

      expect(document.querySelector('.unread-dot-indicator')).toBeFalsy();
    });
  });

  describe('Mark as Read', () => {
    it('panggil markAsReadMutation saat notification yang belum dibaca diklik', async () => {
      const markAsReadFn = vi.fn();
      mockedUseMarkAsRead.mockReturnValue({
        mutate: markAsReadFn,
        isPending: false,
        isError: false,
        error: null,
        isSuccess: false,
        data: null,
      } as unknown as ReturnType<typeof hooks.useMarkAsRead>);

      mockedUseNotifications.mockReturnValue({
        notifications: mockNotifications,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
        isEmpty: false,
        refetch: mockRefetch,
        queryResult: {
          data: mockNotifications,
          isLoading: false,
          isError: false,
          error: null,
          isSuccess: true,
          isEmpty: false,
          refetch: mockRefetch,
        },
      } as unknown as ReturnType<typeof hooks.useNotifications>);

      render(<NotificationCenterPage />);

      const card = screen.getByText('New Message').closest('[role="button"]');
      if (card) {
        fireEvent.click(card);
      }

      expect(markAsReadFn).toHaveBeenCalledWith('1', expect.any(Object));
    });

    it('tidak memanggil markAsRead untuk notification yang sudah dibaca', async () => {
      const readOnly = mockNotifications.filter((n) => n.isRead);
      const markAsReadFn = vi.fn();
      mockedUseMarkAsRead.mockReturnValue({
        mutate: markAsReadFn,
        isPending: false,
        isError: false,
        error: null,
        isSuccess: false,
        data: null,
      } as unknown as ReturnType<typeof hooks.useMarkAsRead>);

      mockedUseNotifications.mockReturnValue({
        notifications: readOnly,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
        isEmpty: false,
        refetch: mockRefetch,
        queryResult: {
          data: readOnly,
          isLoading: false,
          isError: false,
          error: null,
          isSuccess: true,
          isEmpty: false,
          refetch: mockRefetch,
        },
      } as unknown as ReturnType<typeof hooks.useNotifications>);

      render(<NotificationCenterPage />);

      const card = screen.getByText('Group Update').closest('[role="button"]');
      if (card) {
        fireEvent.click(card);
      }

      expect(markAsReadFn).not.toHaveBeenCalled();
    });
  });

  describe('Mark All as Read', () => {
    it('panggil markAllAsReadMutation ketika ada unread notifications', async () => {
      const markAllAsReadFn = vi.fn();
      mockedUseMarkAllAsRead.mockReturnValue({
        mutate: markAllAsReadFn,
        isPending: false,
        isError: false,
        error: null,
        isSuccess: false,
        data: null,
      } as unknown as ReturnType<typeof hooks.useMarkAllAsRead>);

      mockedUseNotifications.mockReturnValue({
        notifications: mockNotifications,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
        isEmpty: false,
        refetch: mockRefetch,
        queryResult: {
          data: mockNotifications,
          isLoading: false,
          isError: false,
          error: null,
          isSuccess: true,
          isEmpty: false,
          refetch: mockRefetch,
        },
      } as unknown as ReturnType<typeof hooks.useNotifications>);

      render(<NotificationCenterPage />);

      const button = screen.getByText('Mark all as read');
      fireEvent.click(button);

      expect(markAllAsReadFn).toHaveBeenCalled();
    });

    it('tidak menampilkan tombol mark all ketika semua notification sudah dibaca', () => {
      const readOnly = mockNotifications.filter((n) => n.isRead);
      mockedUseNotifications.mockReturnValue({
        notifications: readOnly,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
        isEmpty: false,
        refetch: mockRefetch,
        queryResult: {
          data: readOnly,
          isLoading: false,
          isError: false,
          error: null,
          isSuccess: true,
          isEmpty: false,
          refetch: mockRefetch,
        },
      } as unknown as ReturnType<typeof hooks.useNotifications>);

      render(<NotificationCenterPage />);

      expect(screen.queryByText('Mark all as read')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('tampilkan pesan error yang user-friendly saat GET notifications gagal karena network error', () => {
      mockedUseNotifications.mockReturnValue({
        notifications: [],
        isLoading: false,
        isError: true,
        error: new Error('Network Error'),
        isSuccess: false,
        isEmpty: false,
        refetch: mockRefetch,
        queryResult: {
          data: null,
          isLoading: false,
          isError: true,
          error: new Error('Network Error'),
          isSuccess: false,
          isEmpty: false,
          refetch: mockRefetch,
        },
      } as unknown as ReturnType<typeof hooks.useNotifications>);

      render(<NotificationCenterPage />);

      expect(screen.getByText('Failed to Load Notifications')).toBeInTheDocument();
      expect(
        screen.getByText('Network error — please check your connection and try again.')
      ).toBeInTheDocument();
    });

    it('tampilkan tombol Try Again untuk retry saat error', () => {
      mockedUseNotifications.mockReturnValue({
        notifications: [],
        isLoading: false,
        isError: true,
        error: new Error('Server Error'),
        isSuccess: false,
        isEmpty: false,
        refetch: mockRefetch,
        queryResult: {
          data: null,
          isLoading: false,
          isError: true,
          error: new Error('Server Error'),
          isSuccess: false,
          isEmpty: false,
          refetch: mockRefetch,
        },
      } as unknown as ReturnType<typeof hooks.useNotifications>);

      render(<NotificationCenterPage />);

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('tampilkan pesan error user-friendly saat server error 500', () => {
      mockedUseNotifications.mockReturnValue({
        notifications: [],
        isLoading: false,
        isError: true,
        error: new Error('Request failed with status code 500'),
        isSuccess: false,
        isEmpty: false,
        refetch: mockRefetch,
        queryResult: {
          data: null,
          isLoading: false,
          isError: true,
          error: new Error('Request failed with status code 500'),
          isSuccess: false,
          isEmpty: false,
          refetch: mockRefetch,
        },
      } as unknown as ReturnType<typeof hooks.useNotifications>);

      render(<NotificationCenterPage />);

      expect(
        screen.getByText('Server error — please try again later.')
      ).toBeInTheDocument();
    });
  });
});