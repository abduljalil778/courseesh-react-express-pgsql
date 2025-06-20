import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import AppError from './src/utils/AppError.mjs';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './src/routes/auth.js';
import courseRoutes from './src/routes/courses.js';
import bookingRoutes from './src/routes/bookings.js';
import paymentRoutes from './src/routes/payments.js';
import bookingSessionRoutes from './src/routes/bookingSessions.js';
import userRoutes from './src/routes/users.js';
import teacherRoutes from './src/routes/teachers.js';
import payoutRoutes from './src/routes/payouts.js';
import paymentOptionsRoutes from './src/routes/paymentOptions.js';
import dashboardRoutes from './src/routes/dashboard.js';
import errorController from './src/services/errorService.js';
import appSettingRoutes from './src/routes/appSettings.js';
import availabilityRoutes from './src/routes/availability.js';
import financeRoutes from './src/routes/finance.js';

dotenv.config();

const app = express();

// === SETUP DIRECTORY HELPERS ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === GLOBAL MIDDLEWARE ===
app.use(helmet());

// CORS: allow frontend dev port (change for prod)
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// JSON body parser (for JSON APIs)
app.use(express.json());

// app.use((req, res, next) => {
//   // Log ini akan berjalan untuk setiap request yang masuk
//   if (req.originalUrl.includes('/api/')) { // Hanya log untuk request API
//     console.log('--- Incoming API Request ---');
//     console.log('Timestamp:', new Date().toISOString());
//     console.log('Method & URL:', req.method, req.originalUrl);
//     console.log('Content-Type Header:', req.get('Content-Type'));
//     console.log('Request Body (setelah express.json):', req.body);
//     console.log('----------------------------');
//   }
//   next(); // Lanjutkan ke middleware/router berikutnya
// });

// Logging
app.use(morgan('tiny'));

// === STATIC FILES ===
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// === RATE LIMIT (Production only) ===
if (process.env.NODE_ENV === 'production') {
  app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  }));
  console.log('✅ Rate limiter active');
} else {
  console.log('development mode');
}

// === ROUTES ===
app.use('/api/auth',    authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookingsessions', bookingSessionRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api', payoutRoutes); 
app.use('/api', paymentOptionsRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/settings', appSettingRoutes);
app.use('/api/availability', availabilityRoutes);

// === ERROR HANDLER ===
app.use((req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

app.use(errorController);

// === START SERVER ===
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
