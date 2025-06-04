// src/routes/bookings.js
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  submitOverallBookingReport
} from '../controllers/bookingsController.js';
import {
  bookingIdValidator,
  createBookingValidator,
  updateBookingValidator,
  submitOverallReportValidator,
} from '../validators/bookingsValidators.js';
import { runValidation } from '../middleware/validate.js';
import catchAsync from '../utils/catchAsync.js';

const router = express.Router();
router.use(authenticate);

// List bookings (ADMIN / TEACHER / STUDENT)
router.get(
  '/',
  catchAsync(getAllBookings)
);

// Get single booking
router.get(
  '/:id',
  bookingIdValidator,
  runValidation,
  catchAsync(getBookingById)
);

// submit overal booking report
router.put(
  `/:id/overall-report`,
  // authorize('TEACHER', 'ADMIN'),
  bookingIdValidator,
  submitOverallReportValidator,
  runValidation,
  catchAsync(submitOverallBookingReport)
)

// Create booking (STUDENT only)
router.post(
  '/',
  createBookingValidator,
  runValidation,
  catchAsync(createBooking)
);

// Update booking status (STUDENT, ADMIN)
router.put(
  '/:id',
  updateBookingValidator,
  runValidation,
  catchAsync(updateBooking)
);

// Delete booking (STUDENT, ADMIN)
router.delete(
  '/:id',
  bookingIdValidator,
  runValidation,
  catchAsync(deleteBooking)
);

export default router;
