// // server/routes/bookings.js
// import express from 'express';
// import { authenticate, authorize } from '../middleware/auth.js';
// import {
//   getAllBookings,
//   getBookingById,
//   createBooking,
//   updateBooking,
//   deleteBooking
// } from '../controllers/bookingsController.js';

// const router = express.Router();

// // List bookings:
// // - ADMIN sees all
// // - TEACHER sees bookings for their courses
// // - STUDENT sees only their own
// router.get('/', authenticate, getAllBookings);

// // Get one booking (with same role-based logic)
// router.get('/:id', authenticate, getBookingById);

// // Create a booking (only STUDENT)
// router.post('/', authenticate, authorize('STUDENT'), createBooking);

// // Update a booking (e.g. change status; STUDENT or ADMIN)
// router.put('/:id', authenticate, authorize('STUDENT','ADMIN'), updateBooking);

// // Delete a booking (STUDENT or ADMIN)
// router.delete('/:id', authenticate, authorize('STUDENT','ADMIN'), deleteBooking);

// export default router;

// src/routes/bookings.js
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking
} from '../controllers/bookingsController.js';
import {
  bookingIdValidator,
  createBookingValidator,
  updateBookingValidator
} from '../validators/bookingsValidators.js';
import { runValidation } from '../middleware/validate.js';
import catchAsync from '../utils/catchAsync.js';

const router = express.Router();

// List bookings (ADMIN / TEACHER / STUDENT)
router.get(
  '/',
  authenticate,
  catchAsync(getAllBookings)
);

// Get single booking
router.get(
  '/:id',
  authenticate,
  bookingIdValidator,
  runValidation,
  catchAsync(getBookingById)
);

// Create booking (STUDENT only)
router.post(
  '/',
  authenticate,
  authorize('STUDENT'),
  createBookingValidator,
  runValidation,
  catchAsync(createBooking)
);

// Update booking status (STUDENT, ADMIN)
router.put(
  '/:id',
  authenticate,
  authorize('STUDENT','TEACHER'),
  updateBookingValidator,
  runValidation,
  catchAsync(updateBooking)
);

// Delete booking (STUDENT, ADMIN)
router.delete(
  '/:id',
  authenticate,
  authorize('STUDENT','ADMIN'),
  bookingIdValidator,
  runValidation,
  catchAsync(deleteBooking)
);

export default router;
