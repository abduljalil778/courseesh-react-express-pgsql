import {body, param} from 'express-validator';

export const userIdValidator = [
    param('id').isUUID().withMessage('User ID must be a valid UUID'),
]

const PHONE_REGEX = /^\+?[0-9]{10,15}$/; // Regex untuk nomor telepon (10-15 digit, bisa diawali +)

export const createUserValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional({ checkFalsy: true }).trim().if(body('phone').notEmpty()).matches(PHONE_REGEX).withMessage('Invalid phone number format (e.g., 081234567890 or +6281234567890, 10-15 digits).'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').trim().notEmpty().withMessage('Role is required.').isIn(['ADMIN', 'TEACHER', 'STUDENT', 'FINANCE']).withMessage('Role must be ADMIN, TEACHER, STUDENT, or FINANCE'),
];

export const updateUserValidator = [
  param('id').trim().isUUID().withMessage('User ID must be a valid UUID'),

  body('name').optional().trim().notEmpty().withMessage('Name cannot be an empty string if provided'),

  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required if provided'),

  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .customSanitizer(value => (value === '' ? null : value))
    .if((value) => value !== null)
    .matches(PHONE_REGEX)
    .withMessage('Invalid phone number format'),

  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters if provided'),

  body('role')
    .optional()
    .trim()
    .notEmpty().withMessage('Role cannot be empty if provided.')
    .isIn(['ADMIN', 'TEACHER', 'STUDENT', 'FINANCE'])
    .withMessage('Role must be ADMIN, TEACHER, STUDENT, or FINANCE if provided'),

  body('status')
    .optional()
    .trim()
    .notEmpty().withMessage('Status cannot be empty if provided.')
    .isIn(['ACTIVE', 'INACTIVE'])
    .withMessage('Status must be ACTIVE or INACTIVE if provided'),
];

export const updatePayoutInfoValidator = [
  body('bankName').trim().notEmpty().withMessage('Bank name is required.'),
  body('bankAccountHolder').trim().notEmpty().withMessage('Account holder name is required.'),
  body('bankAccountNumber').trim().notEmpty().withMessage('Account number is required.'),
];