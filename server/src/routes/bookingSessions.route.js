import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { markStudentAttendance, updateSessionReport } from '../controllers/bookingSessions.controller.js';
import { upload } from '../middleware/upload.js';
import { runValidation } from '../middleware/validate.js';
import asyncHandler from 'express-async-handler';
import { sessionIdValidator, studentAttendanceValidator } from '../validators/bookingSessionValidators.js';

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
  asyncHandler(updateSessionReport)
);

router.put('/:sessionId/student-attendance',
  authorize('STUDENT'),
  sessionIdValidator,
  studentAttendanceValidator,
  runValidation,
  asyncHandler(markStudentAttendance)
)

export default router;