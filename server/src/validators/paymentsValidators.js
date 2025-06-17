// src/validators/paymentsValidators.js
import { body, param } from 'express-validator';

export const paymentIdValidator = [
  param('id')
    .isUUID()
    .withMessage('payment id must be a valid UUID')
];

export const createPaymentValidator = [
  body('bookingId')
    .isUUID()
    .withMessage('bookingId must be a valid UUID'),
  body('amount')
    .isFloat({ gt: 0 })
    .withMessage('amount must be a positive number'),
  body('method')
    .optional()
    .isIn(['FULL', 'INSTALLMENT'])
    .withMessage('method must be FULL or INSTALLMENT'),
  body('installments')
    .optional()
    .isInt({ min: 2, max: 6 })
    .withMessage('installments must be an integer between 2 and 6'),
];

export const updatePaymentValidator = [
  param('id')
    .isUUID()
    .withMessage('payment id must be a valid UUID'),
  body('amount')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('amount must be a positive number'),
  body('paymentDate')
    .optional()
    .isISO8601()
    .withMessage('paymentDate must be a valid ISO8601 date string'),
  body('paymentStatus')
    .optional()
    .isIn(['PAID', 'FAILED',])
    .withMessage('paymentStatus must be one of PAID, FAILED')
];
