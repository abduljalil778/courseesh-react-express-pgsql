// server/routes/reviews.js
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { 
    createCourseReview, 
    getReviewsForCourse,
    getMyReviewForBooking
} from '../controllers/reviewsController.js';
import { 
    bookingIdParamValidator, 
    createReviewValidator 
} from '../validators/reviewsValidator.js';
import { runValidation } from '../middleware/validate.js';
import catchAsync from '../utils/catchAsync.js';
import { param } from 'express-validator'; // Impor param untuk validasi courseId

const router = express.Router();

// Siswa membuat review untuk sebuah booking
router.post(
  '/:bookingId/review',
  authenticate,
  authorize('STUDENT'),
  bookingIdParamValidator,
  createReviewValidator,
  runValidation,
  catchAsync(createCourseReview)
);

// Siswa mendapatkan review yang pernah dia submit untuk booking tertentu
router.get(
  '/:bookingId/review',
  authenticate,
  authorize('STUDENT'),
  bookingIdParamValidator,
  runValidation,
  catchAsync(getMyReviewForBooking)
);

export default router;