// src/validators/bookingsValidators.js
import { body, param } from 'express-validator';

export const bookingIdValidator = [
  param('id')
    .isUUID()
    .withMessage('booking id must be a valid UUID')
];

export const createBookingValidator = [
  body('courseId')
    .isUUID().withMessage('courseId must be a valid UUID'),
  body('address')
    .isString().notEmpty().withMessage('address is required'),
  body('sessionDates')
    .isArray({ min: 1 }).withMessage('sessionDates must be an array'),
  body('sessionDates.*')
    .isISO8601().withMessage('each session date must be a valid ISO8601 date'),

  // payment
  body('paymentMethod')
    .isIn(['FULL','INSTALLMENT'])
    .withMessage('paymentMethod must be FULL or INSTALLMENT'),

  // if installment, require installments count
  body('installments')
    .if(body('paymentMethod').equals('INSTALLMENT'))
    .isInt({ min: 2, max: 6 })
    .withMessage('installments must be between 2 and 6'),
  ];
export const updateBookingValidator = [
  param('id')
    .isUUID()
    .withMessage('booking id must be a valid UUID'),
  body('status')
    .isIn(['PENDING','CONFIRMED','CANCELLED'])
    .withMessage('booking status must be one of PENDING, CONFIRMED, CANCELLED')
];
