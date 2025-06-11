// src/routes/bookingSessions.js
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { markStudentAttendance, submitOrUpdateSessionReport } from '../controllers/bookingSessionController.js';
import { upload } from '../middleware/upload.js';
import { runValidation } from '../middleware/validate.js';
import catchAsync from '../utils/catchAsync.js';
import { sessionIdValidator, studentAttendanceValidator, submitSessionReportValidator } from '../validators/bookingSessionValidators.js';

const router = express.Router();

router.use(authenticate);

// Teacher submits/updates a report for a specific booking session
// PUT /api/bookingsessions/:sessionId/report
router.put(
  '/:sessionId/report',
  authorize('TEACHER', 'ADMIN'),
  sessionIdValidator,
  upload.single('sessionFile'),
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

export default router;