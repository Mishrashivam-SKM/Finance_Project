import { useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook to manage Socket.IO connection
 * Connects to the backend socket server and joins user-specific room
 * @param {Object} options - Configuration options
 * @param {Function} options.onBudgetUpdate - Callback when budgetUpdate event is received
 * @param {Function} options.onTransactionUpdate - Callback when transactionUpdate event is received
 * @param {Function} options.onDashboardUpdate - Callback when dashboardUpdate event is received
 * @returns {Object} - Socket instance and connection status
 */
const useSocket = ({ onBudgetUpdate, onTransactionUpdate, onDashboardUpdate } = {}) => {
  const { token, user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Memoize callbacks to prevent unnecessary reconnections
  const handleBudgetUpdate = useCallback((data) => {
    console.log('📊 Budget update received:', data);
    if (onBudgetUpdate) {
      onBudgetUpdate(data);
    }
  }, [onBudgetUpdate]);

  const handleTransactionUpdate = useCallback((data) => {
    console.log('💰 Transaction update received:', data);
    if (onTransactionUpdate) {
      onTransactionUpdate(data);
    }
  }, [onTransactionUpdate]);

  const handleDashboardUpdate = useCallback((data) => {
    console.log('📈 Dashboard update received:', data);
    if (onDashboardUpdate) {
      onDashboardUpdate(data);
    }
  }, [onDashboardUpdate]);

  useEffect(() => {
    // Only connect if user is authenticated
    if (!isAuthenticated || !token || !user) {
      return;
    }

    // Determine socket URL based on environment
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';

    console.log('🔌 Connecting to socket server:', socketUrl);

    // Create socket connection
    const socket = io(socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxReconnectAttempts,
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      reconnectAttempts.current = 0;

      // Authenticate with JWT token and join user-specific room
      socket.emit('authenticate', token);
    });

    socket.on('authenticated', (data) => {
      console.log('🔐 Socket authenticated for user:', data.userId);
    });

    socket.on('authentication_error', (error) => {
      console.error('❌ Socket authentication failed:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      reconnectAttempts.current += 1;
      console.error(`⚠️ Socket connection error (attempt ${reconnectAttempts.current}):`, error.message);
      
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached');
      }
    });

    // Listen for real-time events
    socket.on('budgetUpdate', handleBudgetUpdate);
    socket.on('transactionUpdate', handleTransactionUpdate);
    socket.on('dashboardUpdate', handleDashboardUpdate);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Disconnecting socket');
      socket.off('connect');
      socket.off('authenticated');
      socket.off('authentication_error');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('budgetUpdate');
      socket.off('transactionUpdate');
      socket.off('dashboardUpdate');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token, user, handleBudgetUpdate, handleTransactionUpdate, handleDashboardUpdate]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false
  };
};

export default useSocket;
