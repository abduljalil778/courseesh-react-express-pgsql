import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../controllers/coursesController..js';
import catchAsync from '../utils/catchAsync.js';
import { upload } from '../middleware/upload.js';
import { getCourseReviews } from '../controllers/reviewsController.js';

const router = express.Router();



router.get(
  '/',
  authenticate,
  catchAsync(getAllCourses)
);

router.get(
  '/:id',
  authenticate,
  catchAsync(getCourseById)
);

router.post(
  '/',
  authenticate,
  authorize('TEACHER','ADMIN'),
  upload.single('thumbnailFile'),
  catchAsync(createCourse)
);

router.put(
  '/:id/update',
  authenticate,
  authorize('TEACHER','ADMIN'),
  upload.single('thumbnailFile'),
  catchAsync(updateCourse)
);

router.delete(
  '/:id',
  authenticate,
  authorize('TEACHER','ADMIN'),
  catchAsync(deleteCourse)
);

router.get(
  '/:id/reviews',
  catchAsync(getCourseReviews)
)

export default router;