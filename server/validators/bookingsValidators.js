// src/validators/bookingsValidators.js
import { body, param } from 'express-validator';

const PHONE_REGEX = /^\+?[0-9]{10,15}$/; // Samakan dengan yang mungkin Anda gunakan di frontend/Zod

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

  // --- TAMBAHKAN VALIDASI UNTUK DATA SISWA ---
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
  // --- AKHIR VALIDASI DATA SISWA ---

  body('address')
    .trim() // Tambahkan trim
    .isString().notEmpty().withMessage('Address is required'),
  body('sessionDates')
    .isArray({ min: 1 }).withMessage('At least one session date is required'),
  body('sessionDates.*') // Validasi setiap item dalam array
    .isISO8601().toDate().withMessage('Each session date must be a valid date format (YYYY-MM-DD)'),
    // .toDate() akan mengkonversi string tanggal valid menjadi objek Date

  body('paymentMethod')
    .trim()
    .isIn(['FULL', 'INSTALLMENT'])
    .withMessage('paymentMethod must be FULL or INSTALLMENT'),

  body('installments')
    .if(body('paymentMethod').equals('INSTALLMENT')) // Hanya valid jika paymentMethod adalah INSTALLMENT
    .notEmpty().withMessage('Number of installments is required for installment payment method.') // Pastikan ada nilainya
    .isInt({ min: 2, max: 6 }) // Sesuaikan max jika perlu
    .withMessage('Installments must be a number between 2 and 6'),
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