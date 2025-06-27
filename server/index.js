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
import notificationRoutes from './src/routes/notification.route.js';
import chatRoutes from './src/routes/chat.route.js';

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
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', ],
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

// RATE LIMIT (Production only)
if (process.env.NODE_ENV === 'production') {
  app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  }));
  console.log('✅ Rate limiter active');
} else {
  console.log('development mode');
}

// ROUTES
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
app.use('/api/notifications', notificationRoutes)
app.use('/api/conversations', chatRoutes)

// ERROR HANDLER
app.use((req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

app.use(errorController);

// START SERVER
const PORT = process.env.PORT || 4000;
server.listen(PORT, () =>
  console.log(`🚀 Server running with Socket.IO on http://localhost:${PORT}`)
);
