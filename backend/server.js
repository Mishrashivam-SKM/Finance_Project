const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { initializeSocket } = require('./utils/socketManager');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? false 
      : ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize socket manager with io instance
initializeSocket(io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/categories', require('./routes/categories.routes'));
app.use('/api/transactions', require('./routes/transactions.routes'));
app.use('/api/assets', require('./routes/asset.routes'));
app.use('/api/debts', require('./routes/debt.routes'));
app.use('/api/budgets', require('./routes/budget.routes'));
app.use('/api/reports', require('./routes/reports.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/quizzes', require('./routes/quizzes.routes'));

// Serve static files and handle React frontend in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app build
  app.use(express.static(path.join(__dirname, 'client/build')));

  // Fallback route - serve React app for any non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log('Socket.IO initialized and ready');
});
