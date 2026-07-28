import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';

/**
 * useSocket — React hook that manages the Socket.IO connection lifecycle.
 *
 * - Opens the connection when the component mounts.
 * - Cleans up (disconnects) when the component unmounts.
 * - Returns the stable socket instance for attaching event listeners.
 * - Calling this hook in multiple components is safe: the underlying singleton
 *   means only one physical TCP connection is ever established.
 */
const useSocket = (): Socket => {
  // Keep a stable ref so callers always receive the same object
  const socketRef = useRef<Socket>(getSocket());

  useEffect(() => {
    const s = connectSocket();
    socketRef.current = s;

    return () => {
      // Only tear down if this is the top-level owner of the connection.
      // Child components that also call useSocket will receive the cached
      // singleton without re-connecting; only the last unmount should close.
      disconnectSocket();
    };
  }, []); // Empty deps — run exactly once per mount/unmount cycle

  // eslint-disable-next-line react-hooks/refs
  return socketRef.current;
};

export default useSocket;
