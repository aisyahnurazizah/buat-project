import { io, Socket } from 'socket.io-client';

/**
 * Socket.IO client service.
 *
 * Guarantees a single shared Socket instance across the entire application.
 * The socket is created lazily on the first call to getSocket() and reused
 * for every subsequent call, preventing duplicate connections.
 */

const SOCKET_URL: string =
  import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Module-level singleton — only one Socket instance is ever created.
 */
let socket: Socket | null = null;

/**
 * Returns the shared Socket instance, creating it on first access.
 * Socket is configured with `autoConnect: false` so the caller controls when
 * the connection is actually opened, avoiding unexpected side-effects during
 * module load or server-side rendering.
 */
export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,          // Don't connect automatically — call connect() explicitly
      reconnection: true,          // Attempt to reconnect when disconnected
      reconnectionDelay: 1000,     // Wait 1 s before first reconnect attempt
      reconnectionDelayMax: 5000,  // Cap back-off at 5 s
      reconnectionAttempts: 5,     // Give up after 5 consecutive failures
      transports: ['websocket', 'polling'], // Prefer WS, fall back to long-polling
    });

    socket.on('connect', () =>
      console.log('[Socket] Connected — id:', socket?.id)
    );
    socket.on('disconnect', (reason) =>
      console.log('[Socket] Disconnected — reason:', reason)
    );
    socket.on('connect_error', (err) =>
      console.warn('[Socket] Connection error:', err.message)
    );
    socket.on('reconnect_attempt', (n) =>
      console.log(`[Socket] Reconnect attempt #${n}`)
    );
    socket.on('reconnect_failed', () =>
      console.error('[Socket] Reconnection failed after maximum attempts')
    );
  }

  return socket;
};

/**
 * Opens the Socket.IO connection.
 * Safe to call multiple times — no-ops if already connected.
 */
export const connectSocket = (): Socket => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
};

/**
 * Closes the Socket.IO connection and destroys the singleton so a fresh
 * instance is created on the next call to getSocket() / connectSocket().
 * Call this when the user logs out or the app unmounts.
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Returns true if the socket exists and is currently connected.
 */
export const isSocketConnected = (): boolean => {
  return socket?.connected ?? false;
};
