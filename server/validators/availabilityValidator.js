import { body, param } from 'express-validator';

export const unavailableDateValidator = [
  body('date').isISO8601().withMessage('Valid date is required'),
];

export const unavailableIdValidator = [
  param('id').isUUID().withMessage('Invalid ID'),
];