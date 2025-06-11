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

    const studentAttendanceBool = studentAttendance !== undefined ? (String(studentAttendance).toLowerCase() === 'true') : undefined;

    const dataToUpdate = {};
    if (teacherReport !== undefined) dataToUpdate.teacherReport = teacherReport;
    if (studentAttendanceBool !== undefined) dataToUpdate.studentAttendance = studentAttendanceBool;
    if (status !== undefined) {
        dataToUpdate.status = status;
        if (status === SessionStatus.COMPLETED) { // Jika status diubah jadi COMPLETED
            dataToUpdate.sessionCompletedAt = new Date();
        }
    }
    
    if (req.file) {
      const fileUrl = `/uploads/${req.file.filename}`;
      dataToUpdate.teacherUploadedFile = fileUrl;
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

/**
 * PUT /api/bookingsessions/:sessionId/student-attendance
 * Siswa menandai kehadirannya sendiri.
 */
export const markStudentAttendance = async (req, res, next) => {
  const { sessionId } = req.params;
  const { attended } = req.body; // attended adalah boolean
  const studentId = req.user.id; // Diambil dari user yang login (siswa)

  try {
    const bookingSession = await prisma.bookingSession.findUnique({
      where: { id: sessionId },
      include: {
        booking: { // Untuk verifikasi kepemilikan siswa
          select: { studentId: true },
        },
      },
    });

    if (!bookingSession) {
      return next(new AppError('Booking session not found', 404));
    }

    // Verifikasi apakah sesi ini milik siswa yang login
    if (bookingSession.booking.studentId !== studentId) {
      return next(new AppError('You are not authorized to mark attendance for this session', 403));
    }

    // Verifikasi apakah sesi sudah terbuka (isUnlocked)
    if (!bookingSession.isUnlocked) {
      return next(new AppError('This session is currently locked. Payment might be pending.', 403));
    }

    // Verifikasi apakah status sesi masih 'SCHEDULED'
    // Anda mungkin ingin lebih fleksibel, misalnya jika guru belum input, siswa masih bisa input
    if (bookingSession.status !== SessionStatus.SCHEDULED) {
      return next(new AppError(`Attendance can only be marked for scheduled sessions. Current status: ${bookingSession.status}`, 400));
    }
    
    // Jika guru sudah pernah mengisi laporan (yang mungkin termasuk studentAttendance),
    // Anda mungkin tidak ingin siswa mengubahnya lagi, atau Anda bisa punya logika lain.
    // Untuk saat ini, kita biarkan siswa bisa update jika status masih SCHEDULED.
    // if (bookingSession.teacherReport !== null) {
    //   return next(new AppError('Attendance cannot be changed after teacher has submitted a report for this session.', 403));
    // }


    const updatedBookingSession = await prisma.bookingSession.update({
      where: { id: sessionId },
      data: {
        studentAttendance: attended,
        // Anda bisa menambahkan field lain seperti studentAttendanceMarkedAt: new Date() jika perlu
      },
    });

    res.json(updatedBookingSession);
  } catch (err) {
    console.error(`Error marking student attendance for session ID ${sessionId}:`, err);
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        return next(new AppError('Booking session not found for update.', 404));
    }
    next(new AppError(err.message || 'Failed to mark student attendance', 500));
  }
};