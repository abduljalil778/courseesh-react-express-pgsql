import {body, param} from 'express-validator';

export const userIdValidator = [
    param('id').isUUID().withMessage('User ID must be a valid UUID'),
]

export const createUserValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password ≥6 chars'),
  body('role')
    .isIn(['ADMIN','TEACHER','STUDENT'])
    .withMessage('Role must be ADMIN, TEACHER, or STUDENT'),
];

export const updateUserValidator = [
  param('id').isUUID().withMessage('User ID must be a valid UUID'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('role')
    .optional()
    .isIn(['ADMIN','TEACHER','STUDENT'])
    .withMessage('Role must be ADMIN, TEACHER, or STUDENT'),
  body('status')
    .optional()
    .isIn(['ACTIVE','INACTIVE'])
    .withMessage('Status must be ACTIVE or INACTIVE'),
];

