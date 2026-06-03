require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIO = require('socket.io');
const rateLimit = require('express-rate-limit');

const { connectSQL, connectMongoDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { initializeSocket } = require('./services/socket.service');
const errorHandler = require('./middleware/error.middleware');
const { startMLPolling } = require('./services/mlModel.service');
const reportRoutes = require('./routes/report.routes');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const zoneRoutes = require('./routes/zone.routes');
const riskRoutes = require('./routes/risk.routes');
const alertRoutes = require('./routes/alert.routes');
const incidentRoutes = require('./routes/incident.routes');
const sensorRoutes = require('./routes/sensor.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const assistantRoutes = require('./routes/assistant.routes');
const mlModelRoutes = require('./routes/mlModel.routes');

// Initialize Express
const app = express();
const server = http.createServer(app);

app.use('/api/ml-model', mlModelRoutes);

// Initialize Socket.io
const io = socketIO(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

initializeSocket(io);

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev')); // HTTP logging

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'RFD API - AI-Powered Rockfall Detection System',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      zones: '/api/zones',
      risks: '/api/risks',
      alerts: '/api/alerts',
      incidents: '/api/incidents',
      sensors: '/api/sensors',
      assignments: '/api/work-assignments',
      assistant: '/api/assistant',
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/risks', riskRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/work-assignments', assignmentRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const os = require('os');
    const UserSession = require('./models/sql/UserSession');

    // CPU usage (simplified)
    const cpuUsage = Math.round((os.loadavg()[0] / os.cpus().length) * 100);

    // Memory usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);

    // DB response time (simple query)
    const start = Date.now();
    await UserSession.count();
    const dbResponseTime = Date.now() - start;

    // Active sessions
    const activeSessions = await UserSession.count();

    // API response time (mock for now)
    const apiResponseTime = Math.floor(Math.random() * 50) + 50; // 50-100ms

    res.json({
      cpuUsage: `${cpuUsage}%`,
      memoryUsage: `${memoryUsage}%`,
      dbResponseTime: `${dbResponseTime}ms`,
      apiResponseTime: `${apiResponseTime}ms`,
      activeSessions,
      status: 'healthy',
    });
  } catch (error) {
    res.status(500).json({ error: 'Health check failed' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// ─── Database & Server Startup ───────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to databases
    await connectSQL();
    await connectMongoDB();
    
    // Connect to Redis (optional)
    connectRedis();

    startMLPolling();

    // Start server
    server.listen(PORT, () => {
      console.log(`\nServer running on http://localhost:${PORT}`);
      console.log(`WebSocket server initialized`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nSIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});