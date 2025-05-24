// src/validators/bookingsValidators.js
import { body, param } from 'express-validator';

export const bookingIdValidator = [
  param('id')
    .isUUID()
    .withMessage('booking id must be a valid UUID')
];

export const createBookingValidator = [
  body('courseId')
    .isUUID()
    .withMessage('courseId must be a valid UUID'),
  body('bookingDate')
    .isISO8601()
    .withMessage('bookingDate must be a valid ISO8601 date string')
];

export const updateBookingValidator = [
  param('id')
    .isUUID()
    .withMessage('booking id must be a valid UUID'),
  body('status')
    .isIn(['PENDING', 'CONFIRMED', 'CANCELLED'])
    .withMessage('status must be one of PENDING, CONFIRMED, CANCELLED')
];
