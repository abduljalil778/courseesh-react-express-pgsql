// server/validators/courseValidators.js
import { body, param } from 'express-validator';

const ALLOWED_SESSIONS_VALUES = [6, 12, 24];

export const createCourseValidator = [
  body('title').trim().notEmpty().withMessage('title is required'),
  body('description').trim().notEmpty().withMessage('description is required'),
  body('price').isFloat({ gt: 0 }).withMessage('price must be a positive number'),
  // TAMBAHKAN VALIDASI INI:
  body('numberOfSessions')
    .notEmpty().withMessage('Number of sessions is required.')
    .isInt().withMessage('Number of sessions must be an integer.')
    .isIn(ALLOWED_SESSIONS_VALUES)
    .withMessage(`Number of sessions must be one of: ${ALLOWED_SESSIONS_VALUES.join(', ')}`),
  body('classLevel').trim().notEmpty().withMessage('Class level is required'), // Anda mungkin sudah punya ini, pastikan ada
  // 'curriculum' bisa opsional tergantung logika Anda
];

export const updateCourseValidator = [
  param('id').isUUID().withMessage('valid course id is required'),
  body('title').optional().notEmpty().withMessage('title cannot be empty'),
  body('description').optional().notEmpty().withMessage('description cannot be empty'),
  body('price').optional().isFloat({ gt: 0 }).withMessage('price must be a positive number'),
  // TAMBAHKAN VALIDASI INI (jika numberOfSessions bisa diupdate):
  body('numberOfSessions')
    .optional()
    .isInt().withMessage('Number of sessions must be an integer if provided.')
    .isIn(ALLOWED_SESSIONS_VALUES)
    .withMessage(`Number of sessions must be one of: ${ALLOWED_SESSIONS_VALUES.join(', ')} if provided.`),
  body('classLevel').optional().trim().notEmpty().withMessage('Class level cannot be empty if provided'),
];