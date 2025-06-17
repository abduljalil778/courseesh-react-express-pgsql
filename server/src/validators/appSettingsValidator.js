// server/validators/appSettingsValidator.js
import { body } from 'express-validator';

export const updateSettingsValidator = [
  body()
    .isArray({ min: 1 })
    .withMessage('Request body must be an array of settings.'),
  body('*.key')
    .isString()
    .notEmpty()
    .withMessage('Each setting must have a key.'),
  body('*.value')
    .isString()
    .withMessage('Each setting must have a value.'),
];