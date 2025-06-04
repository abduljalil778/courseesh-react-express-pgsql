// src/routes/bookingSessions.js
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { markStudentAttendance, submitOrUpdateSessionReport } from '../controllers/bookingSessionController.js'; // Asumsi Anda sudah buat controller ini
import { runValidation } from '../middleware/validate.js';
import catchAsync from '../utils/catchAsync.js';
import { sessionIdValidator, studentAttendanceValidator, submitSessionReportValidator } from '../validators/bookingSessionValidators.js';

const router = express.Router();

// Semua route di bawah ini memerlukan autentikasi
router.use(authenticate);

// Teacher submits/updates a report for a specific booking session
// PUT /api/bookingsessions/:sessionId/report  (atau :id jika Anda konsisten dengan itu)
router.put(
  '/:sessionId/report', // <--- PERBAIKI INI: :id menjadi :sessionId
  authorize('TEACHER', 'ADMIN'),
  sessionIdValidator, // Validator ini mencari param 'sessionId'
  submitSessionReportValidator,
  runValidation,
  catchAsync(submitOrUpdateSessionReport)
);

router.put('/:sessionId/student-attendance',
  authorize('STUDENT'),
  sessionIdValidator,
  studentAttendanceValidator,
  runValidation,
  catchAsync(markStudentAttendance)
)

// Anda bisa menambahkan route lain untuk BookingSession jika perlu
// Misalnya, GET /api/bookingsessions/:sessionId (jika admin/teacher perlu detail sesi individual)
// atau GET /api/bookings/:bookingId/sessions (untuk mengambil semua sesi dari satu booking,
// tapi ini mungkin sudah ter-cover oleh include di getBookingById)

export default router;