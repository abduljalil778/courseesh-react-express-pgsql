// server/validators/reviewsValidator.js
import { body, param } from 'express-validator';

export const bookingIdParamValidator = [
  param('bookingId')
    .trim()
    .isUUID()
    .withMessage('Booking ID must be a valid UUID'),
];

export const createReviewValidator = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5.'),
  body('comment')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comment must be a string and less than 1000 characters.'),
];