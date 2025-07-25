import * as bookingSessionService from '../services/bookingSession.service.js';
import asyncHandler from 'express-async-handler';

/**
 * Controller untuk guru mengunggah laporan sesi.
 * PUT /api/bookingsessions/:sessionId/report
 */
export const updateSessionReport = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const reportData = req.body;
  const file = req.file;
  const user = req.user;

  const updatedSession = await bookingSessionService.updateSessionReportService(sessionId, reportData, file, user);
  
  res.status(200).json(updatedSession);
});

/**
 * Controller untuk siswa menandai kehadirannya.
 * PUT /api/bookingsessions/:sessionId/student-attendance
 */
export const markStudentAttendance = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { attended } = req.body;
  const user = req.user;

  const updatedSession = await bookingSessionService.markStudentAttendanceService(sessionId, attended, user);

  res.status(200).json(updatedSession);
});