import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { connectDB, disconnectDB } from './config/db.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { parseCookies } from './middlewares/cookieParser.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import recitationRoutes from './routes/recitationRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import statisticsRoutes from './routes/statisticsRoutes.js';
import counterRoutes from './routes/counterRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

export const app = express();
const PORT = process.env.PORT || 5000;

// Security and utility middlewares
app.use(helmet());

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in local dev, origins can be strictly clamped in prod
  },
  credentials: true,
}));

app.use(compression());
app.use(express.json());
app.use(parseCookies);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/recitations', recitationRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/counters', counterRoutes);
app.use('/api/admin', adminRoutes);

// Base Route & Health check
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Al-Kitab API server.',
    version: '1.0.0',
    status: 'healthy',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler (must be registered last)
app.use(errorHandler);

// Server startup flow
export const startServer = async () => {
  try {
    // Wait for MongoDB connection before accepting HTTP requests
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        console.log('HTTP server and database connections closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    return server;
  } catch (error) {
    console.error('Failed to start Al-Kitab server:', error);
    process.exit(1);
  }
};

// Start automatically if executed directly and not running tests
if (process.env.NODE_ENV !== 'test') {
  startServer();
}
