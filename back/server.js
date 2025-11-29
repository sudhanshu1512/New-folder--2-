import './src/config.js'; // Load environment variables
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { initializeEmailQueue, shutdownEmailQueue } from './src/startup/emailQueueInit.js';
import path from "path";


const _dirname = path.resolve();
console.log("Current directory:", _dirname);

// Verify required environment variables
const requiredEnvVars = ['DB_SERVER', 'DB_NAME', 'JWT_SECRET', 'FRONTEND_URL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

// Import routes after env vars are loaded
import authRouter from './src/routes/auth.js';
import bookingRouter from './src/routes/boookingRoutes.js';
import bookingConfirmationRouter from './src/routes/bookingConfirmationRoutes.js';
import cloudinaryRoutes from './src/routes/Cloudinary.js';
import logoRoutes from './src/routes/settings.js';
import profileRoutes from './src/routes/profile.js';
import airportRoutes from './src/routes/airportRoutes.js';
import airlineRoutes from './src/routes/airlineRoutes.js';
import flightRoutes from './src/routes/flightRoutes.js';
import Addinventoryroutes from './src/routes/Addinventoryroutes.js';
import vendorRoutes from './src/routes/vendors.js';
import supplierRoutes from './src/routes/supplierRoutes.js';
import dashboardRoutes from './src/routes/Dashboard.js';
import ledgerRoutes from './src/routes/LedgerReport.js';
import queryRoutes from './src/routes/QueryRoutes.js';

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Added unsafe-inline/eval for common React issues
      connectSrc: [
        "'self'", 
        "https://books-vm03.onrender.com",       // Your Backend URL
        "https://new-folder-2-4ub8.onrender.com", // Your Frontend URL (from logs)
        process.env.FRONTEND_URL                 // Your Environment Variable
      ], 
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"], 
    },
  })
);


app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(cookieParser());

// Test route
app.get('/', (_, res) => res.send({ ok: true, message: 'Server is running' }));

app.use('/api/auth', authRouter);
app.use('/api', bookingRouter);
app.use('/api/bookings', bookingConfirmationRouter);
app.use('/api/cloudinary', cloudinaryRoutes);
app.use('/api/settings', logoRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/airports', airportRoutes);
app.use('/api/airlines', airlineRoutes);
app.use('/api', flightRoutes);
app.use('/api', Addinventoryroutes)
app.use('/api/vendors', vendorRoutes)
app.use('/api', supplierRoutes);
app.use('/api', dashboardRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api', queryRoutes);

app.use(express.static(path.join(_dirname, "/front/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.resolve(_dirname, "front", "dist", "index.html"));
})

// Log all registered routes
console.log('Registered routes:');
app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(Object.keys(r.route.methods).map(method => method.toUpperCase()).join(', '), r.route.path);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});



// Global error handler
app.use((err, req, res, next) => {


  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  // Handle other errors
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});



// Start server
const server = app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Database connection details:', {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
  });
  console.log('Environment variables loaded:', Object.keys(process.env).filter(key => requiredEnvVars.includes(key)));
  console.log(`API running on http://localhost:${PORT}`);
  
  // Initialize email queue system after server starts
  await initializeEmailQueue();
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  shutdownEmailQueue();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  shutdownEmailQueue();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
