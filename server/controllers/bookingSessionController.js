// server/controllers/bookingSessionController.js
import pkg from '@prisma/client';
const { PrismaClient, Prisma, SessionStatus } = pkg; // Impor SessionStatus
const prisma = new PrismaClient();
import AppError from '../utils/AppError.mjs';

/**
 * PUT /api/bookingsessions/:sessionId/report
 * Teacher submits a report for a specific booking session.
 */
export const submitOrUpdateSessionReport = async (req, res, next) => {
  const { sessionId } = req.params;
  const { teacherReport, studentAttendance, status } = req.body; // status baru misal: COMPLETED
  const loggedInTeacherId = req.user.id;

  try {
    const bookingSession = await prisma.bookingSession.findUnique({
      where: { id: sessionId },
      include: {
        booking: {
          include: {
            course: {
              select: { teacherId: true },
            },
          },
        },
      },
    });

    if (!bookingSession) {
      return next(new AppError('Booking session not found', 404));
    }

    // Otorisasi: Pastikan teacher yang login adalah pengajar kursus ini
    if (bookingSession.booking.course?.teacherId !== loggedInTeacherId) {
      return next(new AppError('You are not authorized to submit a report for this session', 403));
    }

    // Data yang akan diupdate
    const dataToUpdate = {};
    if (teacherReport !== undefined) dataToUpdate.teacherReport = teacherReport;
    if (studentAttendance !== undefined) dataToUpdate.studentAttendance = studentAttendance;
    if (status !== undefined) {
        dataToUpdate.status = status;
        if (status === SessionStatus.COMPLETED) { // Jika status diubah jadi COMPLETED
            dataToUpdate.sessionCompletedAt = new Date();
        }
    }
    
    if (Object.keys(dataToUpdate).length === 0) {
        return next(new AppError("No data provided for update.", 400));
    }

    // dataToUpdate.updatedAt = new Date(); // Selalu update updatedAt

    const updatedBookingSession = await prisma.bookingSession.update({
      where: { id: sessionId },
      data: dataToUpdate,
    });

    res.json(updatedBookingSession);
  } catch (err) {
    console.error(`Error submitting session report for session ID ${sessionId}:`, err);
    next(new AppError(err.message || 'Failed to submit session report', 500));
  }
};