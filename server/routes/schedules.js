import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  scheduleIdValidator,
  createScheduleValidator,
  updateScheduleValidator
} from '../validators/schedulesValidator.js';
import { runValidation } from '../middleware/validate.js';
import * as ctrl from '../controllers/scheduleController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('TEACHER','ADMIN','STUDENT'), ctrl.getSchedules);

router.post(
  '/',
  authorize('TEACHER'),
  createScheduleValidator,
  runValidation,
  ctrl.createSchedule
);

router.put(
  '/:id',
  authorize('TEACHER'),
  scheduleIdValidator,
  updateScheduleValidator,
  runValidation,
  ctrl.updateSchedule
);

router.delete(
  '/:id',
  authorize('TEACHER'),
  scheduleIdValidator,
  runValidation,
  ctrl.deleteSchedule
);

export default router;
