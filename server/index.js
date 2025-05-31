import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';

import AppError from './utils/AppError.mjs';
import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import bookingRoutes from './routes/bookings.js';
import paymentRoutes from './routes/payments.js';
import bookingSessionRoutes from './routes/bookingSessions.js';
import userRoutes from './routes/users.js';
import errorController from './controllers/errorController.js';

dotenv.config();

const app = express();

// GLOBAL MIDDLEWARE
app.use(helmet());                              // secure headers
app.use(cors());// lock down your frontend origin
app.use(express.json());                        // parse JSON body
app.use(morgan('tiny'));                        // request logging

// simple rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,                 // limit each IP to 100 requests per window
});

// only use the limiter in production
if (process.env.NODE_ENV === 'production') {
  app.use('/api', limiter);
  console.log('✅ Rate limiter active');
} else {
  console.log('development mode');
}

// ROUTES
app.use('/api/auth',    authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/bookings',bookingRoutes);
app.use('/api/payments',paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookingsessions', bookingSessionRoutes);

// ERROR HANDLER
// catch unhandled routes
app.use((req, res, next) => {
    next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
  });
  
app.use(errorController);

// START SERVER
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
