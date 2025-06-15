// server/validators/courseValidators.js
import { body, param } from 'express-validator';

const ALLOWED_CLASS_LEVELS = ['SD', 'SMP', 'SMA', 'UTBK'];

export const createCourseValidator = [
  body('title').trim().notEmpty().withMessage('title is required'),
  body('description').trim().notEmpty().withMessage('description is required'),
  body('price').isFloat({ min: 0 }).withMessage('price must be a non-negative number'),
  
  // Validasi untuk classLevels (array)
  body('classLevels')
    .isArray({ min: 1 }).withMessage('At least one class level is required.')
    .custom((value) => {
      if (!Array.isArray(value)) return false;
      return value.every(level => ALLOWED_CLASS_LEVELS.includes(level));
    })
    .withMessage(`Each class level must be one of: ${ALLOWED_CLASS_LEVELS.join(', ')}`),
  
  body('curriculum') // Asumsi curriculum tetap opsional dan relevan untuk SMA, SMP, SD
    .optional({ checkFalsy: true }) // atau .if(body('classLevels').custom(levels => levels.some(l => ['SD', 'SMP', 'SMA'].includes(l))))
    .trim()
    .isIn(['MERDEKA', 'K13_REVISI'])
    .withMessage('Invalid curriculum selected if provided.'),
];

export const updateCourseValidator = [
  param('id').isUUID().withMessage('valid course id is required'),
  body('title').optional().notEmpty().withMessage('title cannot be empty'),
  body('description').optional().notEmpty().withMessage('description cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('price must be a non-negative number'),
  
  // Validasi untuk classLevels (array) saat update
  body('classLevels')
    .optional()
    .isArray({ min: 1 }).withMessage('At least one class level is required if provided.')
    .custom((value) => {
      if (!Array.isArray(value)) return false;
      return value.every(level => ALLOWED_CLASS_LEVELS.includes(level));
    })
    .withMessage(`Each class level must be one of: ${ALLOWED_CLASS_LEVELS.join(', ')} if provided.`),

  body('curriculum')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['MERDEKA', 'K13_REVISI'])
    .withMessage('Invalid curriculum selected if provided.'),
];