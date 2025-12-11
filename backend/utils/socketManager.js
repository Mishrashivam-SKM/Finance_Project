const jwt = require('jsonwebtoken');

let io = null;

/**
 * Initialize Socket.IO instance and set up connection handlers
 * @param {Object} socketIO - Socket.IO server instance
 */
const initializeSocket = (socketIO) => {
  io = socketIO;

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle authentication and room joining
    socket.on('authenticate', (token) => {
      try {
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // Join user-specific room
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined their room via socket ${socket.id}`);

        // Send confirmation
        socket.emit('authenticated', { userId });
      } catch (error) {
        console.error('Socket authentication failed:', error.message);
        socket.emit('authentication_error', { message: 'Invalid token' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

/**
 * Emit budget update event to a specific user
 * @param {String} userId - User ID to send the update to
 * @param {Object} data - Optional data to send with the event
 */
const emitBudgetUpdate = (userId, data = {}) => {
  if (!io) {
    console.error('Socket.IO not initialized');
    return;
  }

  const room = `user_${userId}`;
  io.to(room).emit('budgetUpdate', {
    message: 'Budget data updated',
    timestamp: new Date(),
    ...data
  });

  console.log(`Emitted budgetUpdate to user ${userId}`);
};

/**
 * Emit transaction update event to a specific user
 * @param {String} userId - User ID to send the update to
 * @param {Object} data - Optional data to send with the event
 */
const emitTransactionUpdate = (userId, data = {}) => {
  if (!io) {
    console.error('Socket.IO not initialized');
    return;
  }

  const room = `user_${userId}`;
  io.to(room).emit('transactionUpdate', {
    message: 'Transaction data updated',
    timestamp: new Date(),
    ...data
  });

  console.log(`Emitted transactionUpdate to user ${userId}`);
};

/**
 * Emit dashboard update event to a specific user
 * @param {String} userId - User ID to send the update to
 * @param {Object} data - Optional data to send with the event
 */
const emitDashboardUpdate = (userId, data = {}) => {
  if (!io) {
    console.error('Socket.IO not initialized');
    return;
  }

  const room = `user_${userId}`;
  io.to(room).emit('dashboardUpdate', {
    message: 'Dashboard data updated',
    timestamp: new Date(),
    ...data
  });

  console.log(`Emitted dashboardUpdate to user ${userId}`);
};

/**
 * Get the Socket.IO instance
 * @returns {Object} Socket.IO instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = {
  initializeSocket,
  emitBudgetUpdate,
  emitTransactionUpdate,
  emitDashboardUpdate,
  getIO
};
