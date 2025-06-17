import { Prisma, SessionStatus, PayoutStatus } from '@prisma/client';
import prisma from '../../libs/prisma.js';
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
              select: { teacherId: true , price: true,},
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

    const updatedBookingSession = await prisma.bookingSession.update({
      where: { id: sessionId },
      data: dataToUpdate,
    });

    if (status === SessionStatus.COMPLETED) {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.teacherPayout.findFirst({ where: { bookingSessionId: sessionId } });
        if (!existing) {
          let serviceFeePercentage = parseFloat(process.env.DEFAULT_SERVICE_FEE_PERCENTAGE || '0.15');
          const feeSetting = await tx.applicationSetting.findUnique({ where: { key: 'DEFAULT_SERVICE_FEE_PERCENTAGE' } });
          if (feeSetting && !isNaN(parseFloat(feeSetting.value))) {
            serviceFeePercentage = parseFloat(feeSetting.value);
          }
          const pricePerSession = bookingSession.booking.course.price;
          const serviceFeeAmount = parseFloat((pricePerSession * serviceFeePercentage).toFixed(2));
          const honorariumAmount = parseFloat((pricePerSession - serviceFeeAmount).toFixed(2));

          await tx.teacherPayout.create({
            data: {
              bookingId: bookingSession.bookingId,
              bookingSessionId: sessionId,
              teacherId: bookingSession.booking.course.teacherId,
              coursePriceAtBooking: pricePerSession,
              serviceFeePercentage,
              serviceFeeAmount,
              honorariumAmount,
              status: PayoutStatus.PENDING_PAYMENT,
              
            },
          });
        }
      });
    }

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
    if (bookingSession.status !== SessionStatus.SCHEDULED) {
      return next(new AppError(`Attendance can only be marked for scheduled sessions. Current status: ${bookingSession.status}`, 400));
    }

    const updatedBookingSession = await prisma.bookingSession.update({
      where: { id: sessionId },
      data: {
        studentAttendance: attended,
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