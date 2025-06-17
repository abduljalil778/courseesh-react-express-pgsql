// src/validators/authValidators.js
import { body } from 'express-validator';

export const registerValidator = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('email').isEmail().withMessage('valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('password must be at least 6 chars'),
  body('role')
    .optional()
    .isIn(['ADMIN','TEACHER','STUDENT'])
    .withMessage('role must be one of ADMIN, TEACHER, STUDENT'),
];

export const loginValidator = [
  body('email').isEmail().withMessage('valid email is required'),
  body('password').notEmpty().withMessage('password is required'),
];
