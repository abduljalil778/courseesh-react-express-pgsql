import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import catchAsync from '../utils/catchAsync.js';
import { addUnavailableDate, getMyUnavailableDates, removeUnavailableDate, getUnavailableDatesByTeacherId } from '../controllers/availabilityController.js';
import { unavailableDateValidator, unavailableIdValidator } from '../validators/availabilityValidator.js';
import { runValidation } from '../middleware/validate.js';

const router = express.Router();

router.use(authenticate);

router.get('/', catchAsync(getMyUnavailableDates));
router.get('/:teacherId', catchAsync(getUnavailableDatesByTeacherId))
router.post('/', unavailableDateValidator, runValidation, catchAsync(addUnavailableDate));
router.delete('/:id', unavailableIdValidator, runValidation, catchAsync(removeUnavailableDate));

export default router;