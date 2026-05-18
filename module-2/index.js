import express from 'express';
import { connectToDatabase } from './database/db.js';
import cors from 'cors';
import apiRouter from './routes/api.js';
import { initSocket } from './sockets/socket.js';
import { initializeAllModels } from './tools/universalDbTools.js';
import http from 'http';

const app = express();
const PORT = process.env.PORT || 3000;
const httpServer = http.createServer(app);

// Middleware
app.use(cors({
  origin: "*",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
await connectToDatabase();
await initializeAllModels();

// Initialize Socket.io and get io instance
const io = initSocket(httpServer);

// Inject io into every request so controllers can push real-time events
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.get('/healthz', (req, res) => {
  res.send('HR System API is running!');
});

// Debug middleware
app.use((req, res, next) => {
  console.log(`🔍 ${req.method} ${req.path}`);
  next();
});

app.use('/api', apiRouter);

// Basic error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404 - ${req.method} ${req.path}`);
  res.status(404).json({ message: 'Route not found', path: req.path });
});

// Start Server
httpServer.listen(PORT, () => {
  console.log(`🚀 Aurion HR Server running on port ${PORT}`);
});
