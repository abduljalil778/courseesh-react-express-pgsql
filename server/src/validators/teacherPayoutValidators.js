// src/validators/teacherPayoutValidators.js
import { body, param, query } from 'express-validator';
import { PayoutStatus } from '@prisma/client'; // Impor enum

export const payoutIdParamValidator = [
  param('payoutId')
    .trim()
    .isUUID()
    .withMessage('Payout ID must be a valid UUID'),
];

// Validator untuk body saat admin mengupdate status payout
export const updatePayoutStatusValidator = [
  body('status')
    .trim()
    .notEmpty().withMessage('Payout status is required.')
    .isIn(Object.values(PayoutStatus))
    .withMessage(`Invalid payout status. Valid are: ${Object.values(PayoutStatus).join(', ')}`),
  body('payoutTransactionRef')
    .optional({ checkFalsy: true })
    .trim()
    .isString()
    .isLength({ max: 255 }).withMessage('Transaction reference too long.'),
  body('payoutDate')
    .optional({ checkFalsy: true })
    .isISO8601().toDate().withMessage('Invalid payout date format.'),
  body('adminNotes')
    .optional({ checkFalsy: true })
    .trim()
    .isString(),
];

export const listPayoutsQueryValidator = [
    query('status')
        .optional()
        .trim()
        .isIn(Object.values(PayoutStatus))
        .withMessage(`Invalid status filter. Valid are: ${Object.values(PayoutStatus).join(', ')}`),
    query('teacherId')
        .optional()
        .trim()
        .isUUID().withMessage('Teacher ID filter must be a valid UUID'),
];