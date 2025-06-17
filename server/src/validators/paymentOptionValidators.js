import {body, param} from 'express-validator';

export const paymentOptionValidator = [
    body('bankName').trim().notEmpty().withMessage('Bank name is required'),
  body('accountHolder').trim().notEmpty().withMessage('Account holder name is required'),
  body('accountNumber').trim().notEmpty().withMessage('Account number is required'),
  body('logoUrl').optional().isURL().withMessage('Logo URL must be a valid URL'),
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
];
export const idValidator = [
  param('id').isString().notEmpty().withMessage('ID is required'),
];
