// src/validators/courseValidators.js
import { body, param } from 'express-validator';

export const createCourseValidator = [
  body('title').trim().notEmpty().withMessage('title is required'),
  body('description').trim().notEmpty().withMessage('description is required'),
  body('price').isFloat({ gt: 0 }).withMessage('price must be a positive number'),
];

export const updateCourseValidator = [
  param('id').isUUID().withMessage('valid course id is required'),
  body('title').optional().notEmpty().withMessage('title cannot be empty'),
  body('description').optional().notEmpty().withMessage('description cannot be empty'),
  body('price').optional().isFloat({ gt: 0 }).withMessage('price must be a positive number'),
];
