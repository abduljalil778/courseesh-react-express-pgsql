// src/validators/bookingSessionValidators.js
import { body, param } from 'express-validator';
import { SessionStatus } from '@prisma/client'; 

export const sessionIdValidator = [
  param('sessionId')
    .trim()
    // .isUlid() // Jika Anda menggunakan ULID sesuai skema
    .isString().notEmpty().withMessage('Session ID is required.'), // Atau .isUUID() jika itu formatnya
];

export const submitSessionReportValidator = [
  body('teacherReport')
    .optional()
    .isString().trim().notEmpty().withMessage('Teacher report cannot be empty if provided.'),
  body('studentAttendance')
    .optional()
    .isBoolean().withMessage('Student attendance must be true or false.'),
  body('status')
    .optional()
    .isIn(Object.values(SessionStatus)) // Validasi berdasarkan enum SessionStatus
    .withMessage(`Invalid session status. Valid statuses are: ${Object.values(SessionStatus).join(', ')}`),
];

export const studentAttendanceValidator = [
  body('attended')
    .isBoolean({ strict: true }) // Pastikan nilainya true atau false
    .withMessage('Attendance status must be a boolean (true or false).'),
];