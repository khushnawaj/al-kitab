import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import { errorHandler } from './middlewares/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import recitationRoutes from './routes/recitationRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import statisticsRoutes from './routes/statisticsRoutes.js';
import counterRoutes from './routes/counterRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security and utility middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(morgan('dev'));

// Database Connection
connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/recitations', recitationRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/counters', counterRoutes);
app.use('/api/admin', adminRoutes);

// Base Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Al-Kitab API server.',
    version: '1.0.0'
  });
});

// Global Error Handler (must be registered last)
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
});
