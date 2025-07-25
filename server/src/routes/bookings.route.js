// src/routes/bookings.js
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  submitOverallBookingReport,
} from '../controllers/bookings.controller.js';
import { 
  createCourseReview,
  getMyReviewForBooking
} from '../controllers/reviews.controller.js';
import {
  bookingIdValidator,
  createBookingValidator,
  updateBookingValidator,
  submitOverallReportValidator,
} from '../validators/bookingsValidators.js';
import { runValidation } from '../middleware/validate.js';
import asyncHandler from 'express-async-handler';
import { createReviewValidator } from '../validators/reviewsValidator.js';

const router = express.Router();
router.use(authenticate);

// List bookings (ADMIN / TEACHER / STUDENT)
router.get(
  '/',
  asyncHandler(getAllBookings)
);

// Get single booking
router.get(
  '/:id',
  bookingIdValidator,
  runValidation,
  asyncHandler(getBookingById)
);

// submit overal booking report
router.put(
  `/:id/overall-report`,
  // authorize('TEACHER', 'ADMIN'),
  bookingIdValidator,
  submitOverallReportValidator,
  runValidation,
  asyncHandler(submitOverallBookingReport)
)

// Create booking (STUDENT only)
router.post(
  '/',
  createBookingValidator,
  runValidation,
  asyncHandler(createBooking)
);

// Update booking status (STUDENT, ADMIN)
router.put(
  '/:id',
  updateBookingValidator,
  runValidation,
  asyncHandler(updateBooking)
);

// Delete booking (STUDENT, ADMIN)
router.delete(
  '/:id',
  bookingIdValidator,
  runValidation,
  asyncHandler(deleteBooking)
);

// Siswa membuat review untuk sebuah booking
router.post(
  '/:id/review',
  authenticate,
  authorize('STUDENT'),
  createReviewValidator,
  runValidation,
  asyncHandler(createCourseReview)
);

// Siswa mendapatkan review yang pernah dia submit untuk booking tertentu
router.get(
  '/:id/review',
  authenticate,
  authorize('STUDENT'),
  bookingIdValidator,
  runValidation,
  asyncHandler(getMyReviewForBooking)
);

export default router;
