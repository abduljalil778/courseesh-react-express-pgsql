import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
} from '../controllers/coursesController.js';
import {
  createCourseValidator,
  updateCourseValidator
} from '../validators/courseValidators.js';
import { runValidation } from '../middleware/validate.js';
import catchAsync from '../utils/catchAsync.js';

const router = express.Router();
router.use(authenticate)

router.get('/', catchAsync(getAllCourses));
router.get('/:id', catchAsync(getCourseById));

router.post(
  '/',
  authorize('TEACHER','ADMIN'),
  createCourseValidator,
  runValidation,
  catchAsync(createCourse)
);

router.put(
  '/:id',
  authorize('TEACHER','ADMIN'),
  updateCourseValidator,
  runValidation,
  catchAsync(updateCourse)
);

router.delete(
  '/:id',
  authorize('TEACHER','ADMIN'),
  catchAsync(deleteCourse)
);

export default router;
