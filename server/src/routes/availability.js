import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import catchAsync from '../utils/catchAsync.js';
import { addUnavailableDate, getMyUnavailableDates, removeUnavailableDate } from '../controllers/availabilityController.js';
import { unavailableDateValidator, unavailableIdValidator } from '../validators/availabilityValidator.js';
import { runValidation } from '../middleware/validate.js';

const router = express.Router();

router.use(authenticate, authorize('TEACHER'));

router.get('/', catchAsync(getMyUnavailableDates));
router.post('/', unavailableDateValidator, runValidation, catchAsync(addUnavailableDate));
router.delete('/:id', unavailableIdValidator, runValidation, catchAsync(removeUnavailableDate));

export default router;