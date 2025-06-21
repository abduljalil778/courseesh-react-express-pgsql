import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import catchAsync from '../utils/catchAsync.js';
import { getMyUnavailableDates, removeUnavailableDate, getTeacherSchedule, addUnavailableSlots } from '../controllers/availabilityController.js';
import { unavailableDateValidator, unavailableIdValidator } from '../validators/availabilityValidator.js';
import { runValidation } from '../middleware/validate.js';

const router = express.Router();

router.use(authenticate);

router.get('/', catchAsync(getMyUnavailableDates));
router.get('/schedule/:id', catchAsync(getTeacherSchedule))
// router.post('/', unavailableDateValidator, runValidation, catchAsync(addUnavailableDate));
router.post('/slots', authorize('TEACHER'), catchAsync(addUnavailableSlots));
router.delete('/:id', catchAsync(removeUnavailableDate));

export default router;