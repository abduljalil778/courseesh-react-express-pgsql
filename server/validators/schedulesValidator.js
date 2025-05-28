import { body, param } from 'express-validator';

export const scheduleIdValidator = [
  param('id').isUUID().withMessage('Invalid schedule ID'),
];

export const createScheduleValidator = [
  body('courseId').isUUID().withMessage('Course ID required'),
  body('startTime').isISO8601().withMessage('Valid startTime needed'),
  body('endTime').isISO8601().withMessage('Valid endTime needed'),
];

export const updateScheduleValidator = [
  param('id').isUUID().withMessage('Invalid schedule ID'),
  body('startTime').optional().isISO8601(),
  body('endTime').optional().isISO8601(),
];
