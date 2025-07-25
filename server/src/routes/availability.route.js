import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import asyncHandler from 'express-async-handler';
import { getMyUnavailableDates, removeUnavailableDate, getTeacherSchedule, addUnavailableSlots } from '../controllers/availability.controller.js';
import { unavailableDateValidator, unavailableIdValidator } from '../validators/availabilityValidator.js';
import { runValidation } from '../middleware/validate.js';

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(getMyUnavailableDates));
router.get('/schedule/:id', asyncHandler(getTeacherSchedule))
router.post('/slots', authorize('TEACHER'), asyncHandler(addUnavailableSlots));
router.delete('/:id', asyncHandler(removeUnavailableDate));

export default router;