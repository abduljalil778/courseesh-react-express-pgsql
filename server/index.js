import express from 'express';
import http from 'http';
import { initSocket } from './socket.js';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import AppError from './src/utils/AppError.mjs';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './src/routes/auth.route.js';
import courseRoutes from './src/routes/courses.route.js';
import bookingRoutes from './src/routes/bookings.route.js';
import paymentRoutes from './src/routes/payments.route.js';
import bookingSessionRoutes from './src/routes/bookingSessions.route.js';
import userRoutes from './src/routes/users.route.js';
import teacherRoutes from './src/routes/teachers.route.js';
import payoutRoutes from './src/routes/payouts.route.js';
import paymentOptionsRoutes from './src/routes/paymentOptions.route.js';
import dashboardRoutes from './src/routes/dashboard.route.js';
import errorHandler from './src/middleware/error.js';
import appSettingRoutes from './src/routes/appSettings.route.js';
import availabilityRoutes from './src/routes/availability.route.js';
import notificationRoutes from './src/routes/notification.route.js';
import chatRoutes from './src/routes/chat.route.js';
import { initPayoutScheduler } from './src/jobs/payoutScheduler.js';
import honorariumRoutes from './src/routes/honorarium.route.js';
import categoryRoutes from './src/routes/category.route.js';


dotenv.config();

const app = express();
const server = http.createServer(app);

const io = initSocket(server);

export { io };

// SETUP DIRECTORY HELPERS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GLOBAL MIDDLEWARE
app.use(helmet());

// CORS: allow frontend dev port (change for prod)
const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL
];

if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}

app.use(cors({
  origin: (origin, callback) => {
    // Izinkan request tanpa origin (seperti dari Postman atau server-side)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// JSON body parser (for JSON APIs)
app.use(express.json());

// Logging
app.use(morgan('tiny'));

// STATIC FILES
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// // RATE LIMIT (Production only)
// app.use('/api', rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
// }));
// console.log('✅ Rate limiter active');

// ROUTES
app.use('/api/auth',    authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookingsessions', bookingSessionRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api', payoutRoutes); 
app.use('/api', paymentOptionsRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/settings', appSettingRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/notifications', notificationRoutes)
app.use('/api/conversations', chatRoutes)
app.use('/api/honorariums', honorariumRoutes)
app.use('/api/categories', categoryRoutes);

// ERROR HANDLER
app.use((req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

app.use(errorHandler);

// START SERVER
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running with Socket.IO on http://localhost:${PORT}`)
  
  initPayoutScheduler();
  console.log('✅ Payout scheduler initialized');
});
