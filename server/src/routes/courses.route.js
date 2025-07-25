import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../controllers/courses.controller.js';
import asyncHandler from 'express-async-handler';
import { upload } from '../middleware/upload.js';
import { getCourseReviews } from '../controllers/reviews.controller.js';

const router = express.Router();



router.get(
  '/',
  authenticate,
  asyncHandler(getAllCourses)
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(getCourseById)
);

router.post(
  '/',
  authenticate,
  authorize('TEACHER','ADMIN'),
  upload.single('thumbnailFile'),
  asyncHandler(createCourse)
);

router.put(
  '/:id/update',
  authenticate,
  authorize('TEACHER','ADMIN'),
  upload.single('thumbnailFile'),
  asyncHandler(updateCourse)
);

router.delete(
  '/:id',
  authenticate,
  authorize('TEACHER','ADMIN'),
  asyncHandler(deleteCourse)
);

router.get(
  '/:id/reviews',
  asyncHandler(getCourseReviews)
)

export default router;