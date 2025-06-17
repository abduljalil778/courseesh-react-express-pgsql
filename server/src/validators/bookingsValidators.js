// src/validators/bookingsValidators.js
import { body, param } from 'express-validator';

const PHONE_REGEX = /^\+?[0-9]{10,15}$/; // Samakan dengan yang mungkin Anda gunakan di frontend/Zod
const ALLOWED_INSTALLMENT_VALUES = [2, 3];


export const bookingIdValidator = [
  param('id')
    .trim() // Tambahkan trim
    .isUUID()
    .withMessage('Booking ID must be a valid UUID'),
];

export const createBookingValidator = [
  body('courseId')
    .trim() // Tambahkan trim
    .isUUID().withMessage('courseId must be a valid UUID'),
  body('studentFullName')
    .trim()
    .notEmpty().withMessage('Student full name is required'),
  body('studentEmail')
    .isEmail().withMessage('A valid student email is required')
    .normalizeEmail(), // Normalisasi email
  body('studentPhone')
    .optional({ checkFalsy: true }) // Opsional, '' atau null akan dianggap "kosong"
    .trim()
    .if(body('studentPhone').notEmpty()) // Hanya validasi jika phone ada isinya setelah trim
    .matches(PHONE_REGEX)
    .withMessage('Invalid student phone number format (e.g., 08123... or +62812..., 10-15 digits).'),
  body('address')
    .trim() // Tambahkan trim
    .isString().notEmpty().withMessage('Address is required'),
  body('sessionDates')
    .isArray({ min: 1 }).withMessage('At least one session date is required'),
  body('sessionDates.*') // Validasi setiap item dalam array
    .isISO8601().toDate().withMessage('Each session date must be a valid date format (YYYY-MM-DD)'),
  body('paymentMethod')
    .trim()
    .isIn(['FULL', 'INSTALLMENT'])
    .withMessage('paymentMethod must be FULL or INSTALLMENT'),
  body('installments')
  .if(body('paymentMethod').equals('INSTALLMENT'))
  .notEmpty().withMessage('Number of installments is required for installment payment method.')
  .isInt().withMessage('Installments must be a number.') // Pastikan integer
  .isIn(ALLOWED_INSTALLMENT_VALUES) // Validasi nilai yang diizinkan
  .withMessage(`Installments must be one of: ${ALLOWED_INSTALLMENT_VALUES.join(', ')}`),
];

export const updateBookingValidator = [
  param('id')
    .trim() // Tambahkan trim
    .isUUID()
    .withMessage('Booking ID must be a valid UUID'),
  body('bookingStatus') // Ubah 'status' menjadi 'bookingStatus' agar konsisten dengan controller & model
    .trim()
    .notEmpty().withMessage('Booking status is required.')
    .isIn(['PENDING', 'CONFIRMED', 'CANCELLED'])
    .withMessage('Booking status must be one of PENDING, CONFIRMED, CANCELLED'),
];

export const submitOverallReportValidator = [
  param('id').isUUID().withMessage('Booking ID must be a valid UUID'),
  body('overallTeacherReport').optional().isString().trim().notEmpty().withMessage('Overall report cannot be empty if provided'),
  body('finalGrade').optional().isString().trim().notEmpty().withMessage('Final grade cannot be empty if provided'),
];