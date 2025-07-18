import { Prisma, SessionStatus, PayoutStatus } from '@prisma/client';
import prisma from '../../libs/prisma.js';
import AppError from '../utils/AppError.mjs';

/**
 * Service untuk guru mengunggah laporan sesi.
 * @param {string} sessionId - ID dari sesi booking.
 * @param {object} reportData - Data laporan { teacherReport, studentAttendance, status }.
 * @param {object} file - File yang diunggah (dari multer).
 * @param {object} user - User guru yang login.
 * @returns {Promise<object>}
 */
export async function updateSessionReportService(sessionId, reportData, file, user) {
  const { teacherReport, studentAttendance, status } = reportData;
  const loggedInTeacherId = user.id;

  const bookingSession = await prisma.bookingSession.findUnique({
    where: { id: sessionId },
    include: {
      booking: {
        include: {
          course: { select: { teacherId: true, price: true } },
        },
      },
    },
  });

  if (!bookingSession) {
    throw new AppError('Booking session not found', 404);
  }

  // Otorisasi: Pastikan guru yang login adalah pengajar kursus ini
  if (bookingSession.booking.course?.teacherId !== loggedInTeacherId) {
    throw new AppError('You are not authorized to submit a report for this session', 403);
  }

  const studentAttendanceBool = studentAttendance !== undefined ? (String(studentAttendance).toLowerCase() === 'true') : undefined;

  const dataToUpdate = {};
  if (teacherReport !== undefined) dataToUpdate.teacherReport = teacherReport;
  if (studentAttendanceBool !== undefined) dataToUpdate.studentAttendance = studentAttendanceBool;
  if (status !== undefined) {
    dataToUpdate.status = status;
    if (status === SessionStatus.COMPLETED) {
      dataToUpdate.sessionCompletedAt = new Date();
    }
  }
  
  if (file) {
    dataToUpdate.teacherUploadedFile = `/uploads/${file.filename}`;
  }

  if (Object.keys(dataToUpdate).length === 0) {
    throw new AppError("No data provided for update.", 400);
  }

  // Transaksi untuk update sesi dan membuat payout jika sesi selesai
  return await prisma.$transaction(async (tx) => {
    const updatedSession = await tx.bookingSession.update({
      where: { id: sessionId },
      data: dataToUpdate,
    });

    // // Jika sesi selesai, buat record payout untuk guru
    // if (status === SessionStatus.COMPLETED) {
    //   const existingPayout = await tx.teacherPayout.findFirst({ where: { bookingSessionId: sessionId } });
    //   if (!existingPayout) {
    //     // Ambil service fee dari settings
    //     let serviceFeePercentage = parseFloat(process.env.DEFAULT_SERVICE_FEE_PERCENTAGE || '0.15');
    //     const feeSetting = await tx.applicationSetting.findUnique({ where: { key: 'DEFAULT_SERVICE_FEE_PERCENTAGE' } });
    //     if (feeSetting && !isNaN(parseFloat(feeSetting.value))) {
    //       serviceFeePercentage = parseFloat(feeSetting.value);
    //     }

    //     const pricePerSession = bookingSession.booking.course.price;
    //     const serviceFeeAmount = parseFloat((pricePerSession * serviceFeePercentage).toFixed(2));
    //     const honorariumAmount = parseFloat((pricePerSession - serviceFeeAmount).toFixed(2));

    //     await tx.teacherPayout.create({
    //       data: {
    //         bookingId: bookingSession.bookingId,
    //         bookingSessionId: sessionId,
    //         teacherId: bookingSession.booking.course.teacherId,
    //         coursePriceAtBooking: pricePerSession,
    //         serviceFeePercentage,
    //         serviceFeeAmount,
    //         honorariumAmount,
    //         status: PayoutStatus.PENDING_PAYMENT,
    //       },
    //     });
    //   }
    // }
    return updatedSession;
  });
}

/**
 * Service untuk siswa menandai kehadirannya.
 * @param {string} sessionId - ID dari sesi booking.
 * @param {boolean} attended - Status kehadiran (true/false).
 * @param {object} user - User siswa yang login.
 * @returns {Promise<object>}
 */
export async function markStudentAttendanceService(sessionId, attended, user) {
  const studentId = user.id;

  const bookingSession = await prisma.bookingSession.findUnique({
    where: { id: sessionId },
    include: {
      booking: { select: { studentId: true } },
    },
  });

  if (!bookingSession) {
    throw new AppError('Booking session not found', 404);
  }

  // Verifikasi kepemilikan
  if (bookingSession.booking.studentId !== studentId) {
    throw new AppError('You are not authorized to mark attendance for this session', 403);
  }

  // Verifikasi sesi sudah terbuka
  if (!bookingSession.isUnlocked) {
    throw new AppError('This session is currently locked. Payment might be pending.', 403);
  }

  // Verifikasi status sesi masih 'SCHEDULED'
  if (bookingSession.status !== SessionStatus.SCHEDULED) {
    throw new AppError(`Attendance can only be marked for scheduled sessions. Current status: ${bookingSession.status}`, 400);
  }

  try {
    return await prisma.bookingSession.update({
      where: { id: sessionId },
      data: { studentAttendance: attended },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new AppError('Booking session not found for update.', 404);
    }
    throw new AppError(err.message || 'Failed to mark student attendance', 500);
  }
}