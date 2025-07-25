import { body, param, } from 'express-validator';

export const idValidator = [
    param('id').isUUID().withMessage('Category ID must be a valid UUID'),
]

export const categoryValidator = [
    body('name').trim().notEmpty().withMessage('Category name is required'),

]