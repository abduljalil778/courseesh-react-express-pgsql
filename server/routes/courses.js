// server/routes/courses.js (Versi Perbaikan Final)
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
} from '../controllers/coursesController.js';
import catchAsync from '../utils/catchAsync.js';
import { upload } from '../middleware/upload.js'; // Impor multer dari middleware

const router = express.Router();

router.get('/', catchAsync(getAllCourses));
router.get('/:id', catchAsync(getCourseById));

router.post(
  '/',
  authenticate,
  authorize('TEACHER','ADMIN'),
  upload.single('thumbnailFile'), // Nama field file dari form
  catchAsync(createCourse)
);

router.post(
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

export default router;