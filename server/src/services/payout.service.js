// import { Prisma, PayoutStatus } from '@prisma/client'
// import AppError from '../utils/AppError.mjs';
// import prisma from '../../libs/prisma.js'
// import { io } from '../../index.js';
// import { format } from 'date-fns';
// import { id as localeID} from 'date-fns/locale';

// /**
//  * Service untuk mengambil semua data payout guru dengan filter dan paginasi.
//  * @param {object} filters - Opsi filter dari query: { search, status, teacherId, page, limit, sortBy, sortDir }.
//  * @returns {Promise<{payouts: Array, total: number}>}
//  */
// export async function getAllTeacherPayoutsService(filters = {}) {
//   let {
//     search = "", status, teacherId, page = 1, limit = 8, sortBy = "createdAt", sortDir = "desc"
//   } = filters;

//   page = parseInt(page) || 1;
//   limit = parseInt(limit) || 8;
//   const skip = (page - 1) * limit;

//   const where = {};
//   if (status) where.status = status;
//   if (teacherId) where.teacherId = teacherId;
//   if (search) {
//     where.OR = [
//       { bookingId: { contains: search, mode: 'insensitive' } },
//       { teacher: { name: { contains: search, mode: 'insensitive' } } },
//       { teacher: { email: { contains: search, mode: 'insensitive' } } },
//       { teacher: { bankAccountHolder: { contains: search, mode: 'insensitive' } } },
//       { teacher: { bankAccountNumber: { contains: search, mode: 'insensitive' } } },
//       { booking: { course: { title: { contains: search, mode: 'insensitive' } } } },
//     ];
//   }

//   const orderBy = {};
//   if (["createdAt", "honorariumAmount", "status"].includes(sortBy)) {
//     orderBy[sortBy] = sortDir === "asc" ? "asc" : "desc";
//   } else {
//     orderBy.createdAt = "desc";
//   }

//   const total = await prisma.teacherPayout.count({ where });
//   const payouts = await prisma.teacherPayout.findMany({
//     where,
//     skip,
//     take: limit,
//     include: {
//       teacher: {
//         select: {
//           id: true, name: true, email: true, bankName: true,
//           bankAccountHolder: true, bankAccountNumber: true,
//         },
//       },
//     },
//     orderBy: {[sortBy]: sortDir},
//   });

//   return { payouts, total };
// }

// /**
//  * Service untuk mengambil data payout tunggal berdasarkan ID.
//  * @param {string} payoutId - ID dari payout.
//  * @returns {Promise<object>}
//  */
// export async function getTeacherPayoutByIdService(payoutId) {
//     const payout = await prisma.teacherPayout.findUnique({
//         where: { id: payoutId },
//         include: {
//           teacher: {
//             select: { id: true, name: true, email: true, bankName: true, bankAccountHolder: true, bankAccountNumber: true, avatarUrl: true },
//           },
//           booking: {
//             select: { id: true, course: { select: { title: true } }, student: { select: { name: true } } },
//           },
//           bookingSession: { select: { id: true, sessionDate: true } }
//         },
//     });

//     if (!payout) {
//         throw new AppError(`Payout with ID ${payoutId} not found`, 404);
//     }
//     return payout;
// }

// /**
//  * Service untuk mengambil detail semua sesi yang termasuk dalam satu payout.
//  * @param {string} payoutId - ID dari payout.
//  * @returns {Promise<Array>}
//  */
// export async function getSessionsByPayoutIdService(payoutId) {
//     return await prisma.bookingSession.findMany({
//         where: { payoutId: payoutId },
//         include: {
//             booking: {
//                 select: {
//                     id: true,
//                     course: { select: { title: true } },
//                     student: { select: { name: true } }
//                 }
//             }
//         },
//         orderBy: { sessionDate: 'asc' }
//     });
// }


// /**
//  * Service untuk memperbarui data payout guru.
//  * @param {string} payoutId - ID dari payout yang akan diupdate.
//  * @param {object} payoutData - Data yang akan diupdate { status, payoutTransactionRef, payoutDate, adminNotes }.
//  * @param {object} file - File bukti transfer yang diunggah (dari multer).
//  * @returns {Promise<object>}
//  */
// export async function updateTeacherPayoutService(payoutId, payoutData, file) {
//   const { status, payoutTransactionRef, payoutDate, adminNotes } = payoutData;

//   if (status && !Object.values(PayoutStatus).includes(status)) {
//     throw new AppError(`Invalid payout status: ${status}`, 400);
//   }

//   const dataToUpdate = {};
//   if (status !== undefined) dataToUpdate.status = status;
//   if (payoutTransactionRef !== undefined) dataToUpdate.payoutTransactionRef = payoutTransactionRef;
//   if (payoutDate !== undefined) dataToUpdate.payoutDate = payoutDate ? new Date(payoutDate) : null;
//   if (adminNotes !== undefined) dataToUpdate.adminNotes = adminNotes;
//   if (file) {
//     dataToUpdate.adminProofOfPaymentUrl = `/uploads/${file.filename}`;
//   }

//   if (Object.keys(dataToUpdate).length === 0) {
//       throw new AppError('No data provided for payout update.', 400);
//   }

//   try {
//     const updatedPayout = await prisma.teacherPayout.update({
//       where: { id: payoutId },
//       data: dataToUpdate,
//       include: {
//          teacher: { select: { id: true, name: true, email: true } },
//          booking: { select: { id: true, course: { select: { title: true } } } },
//          bookingSession: { select: { id: true, sessionDate: true } }
//       }
//     });

//     // Kirim notifikasi jika status diubah menjadi PAID
//     if (updatedPayout.status === 'PAID') {
//       const { teacherId, booking, bookingSession } = updatedPayout;
//       const courseName = booking.course.title;
//       const sessionDate = bookingSession.sessionDate;

//       const formattedSessionDate = format(new Date(sessionDate), 'EEEE, dd MMMM yyyy, HH:mm', { locale: localeID });
//       const notificationContent = `Selamat, honor Anda untuk kursus ${courseName} pada sesi ${formattedSessionDate} telah dibayarkan.`;
  
//       const newNotification = await prisma.notification.create({
//         data : { recipientId: teacherId, content: notificationContent, link: `/teacher/my-payouts` }
//       });
  
//       io.to(teacherId).emit('new_notification', { message: notificationContent, notification: newNotification });
//     }

//     return updatedPayout;

//   } catch (err) {
//     if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
//       throw new AppError(`TeacherPayout with ID ${payoutId} not found`, 404);
//     }
//     throw new AppError(err.message || 'Failed to update payout', 500);
//   }
// }

// server/src/services/payout.service.js

import { Prisma, PayoutStatus } from '@prisma/client';
import AppError from '../utils/AppError.mjs';
import prisma from '../../libs/prisma.js';
import { io } from '../../index.js';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

/**
 * Service untuk Admin/Finance mengambil semua data payout per periode.
 * @param {object} filters - Opsi filter dari query.
 * @returns {Promise<{payouts: Array, total: number}>}
 */
export async function getAllTeacherPayoutsService(filters = {}) {
  const { search = "", status, teacherId, page = 1, limit = 8, sortBy = "createdAt", sortDir = "desc" } = filters;

  const where = {};
  if (status) where.status = status;
  if (teacherId) where.teacherId = teacherId;
  if (filters.teacherId) {
    where.teacherId = filters.teacherId;
    // Jika difilter berdasarkan guru, hanya tampilkan yang sudah dibayar
    // where.status = 'PAID';
  } else {
    // Untuk admin, tampilkan semua status kecuali jika ada filter
    if (filters.status) where.status = filters.status;
  }
  if (search) {
    where.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { teacher: { name: { contains: search, mode: 'insensitive' } } },
      { teacher: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const total = await prisma.teacherPayout.count({ where });
  const payouts = await prisma.teacherPayout.findMany({
    where,
    skip: (parseInt(page) - 1) * parseInt(limit),
    take: parseInt(limit),
    include: {
      teacher: {
        select: {
          id: true, name: true, email: true, bankName: true,
          bankAccountHolder: true, bankAccountNumber: true,
        },
      },
    },
    orderBy: { [sortBy]: sortDir },
  });

  return { payouts, total };
}

/**
 * Service untuk mengambil data payout tunggal berdasarkan ID.
 * @param {string} payoutId - ID dari payout periode.
 * @returns {Promise<object>}
 */
export async function getTeacherPayoutByIdService(payoutId) {
    const payout = await prisma.teacherPayout.findUnique({
        where: { id: payoutId },
        include: {
          teacher: {
            select: { id: true, name: true, email: true, bankName: true, bankAccountHolder: true, bankAccountNumber: true, avatarUrl: true },
          },
        },
    });

    if (!payout) {
        throw new AppError(`Payout with ID ${payoutId} not found`, 404);
    }
    return payout;
}

/**
 * Service BARU untuk mengambil detail sesi dari sebuah payout periode.
 * @param {string} payoutId - ID dari payout.
 * @returns {Promise<Array>}
 */
export async function getSessionsByPayoutIdService(payoutId) {
    return await prisma.bookingSession.findMany({
        where: { payoutId: payoutId },
        include: {
            booking: {
                select: {
                    id: true,
                    course: { select: { title: true } },
                    student: { select: { name: true } }
                }
            }
        },
        orderBy: { sessionDate: 'asc' }
    });
}

/**
 * Service untuk memperbarui data payout guru.
 * @param {string} payoutId - ID dari payout periode yang akan diupdate.
 * @param {object} payoutData - Data yang akan diupdate.
 * @param {object} file - File bukti transfer yang diunggah.
 * @returns {Promise<object>}
 */
export async function updateTeacherPayoutService(payoutId, payoutData, file) {
  const { status, payoutTransactionRef, payoutDate, adminNotes } = payoutData;

  if (status && !Object.values(PayoutStatus).includes(status)) {
    throw new AppError(`Invalid payout status: ${status}`, 400);
  }

  const dataToUpdate = {};
  if (status !== undefined) dataToUpdate.status = status;
  if (payoutTransactionRef !== undefined) dataToUpdate.payoutTransactionRef = payoutTransactionRef;
  if (payoutDate !== undefined) dataToUpdate.payoutDate = payoutDate ? new Date(payoutDate) : null;
  if (adminNotes !== undefined) dataToUpdate.adminNotes = adminNotes;
  if (file) {
    dataToUpdate.adminProofOfPaymentUrl = `/uploads/${file.filename}`;
  }

  if (Object.keys(dataToUpdate).length === 0) {
      throw new AppError('No data provided for payout update.', 400);
  }

  try {
    const updatedPayout = await prisma.teacherPayout.update({
      where: { id: payoutId },
      data: dataToUpdate,
      include: { teacher: { select: { id: true, name: true } } }
    });

    if (updatedPayout.status === 'PAID') {
      const { teacherId, periodStartDate, periodEndDate } = updatedPayout;
      const periodStr = `${format(periodStartDate, 'MMM yyyy')}`;
      const notificationContent = `Selamat, honor Anda untuk periode ${periodStr} telah dibayarkan.`;
  
      const newNotification = await prisma.notification.create({
        data : { recipientId: teacherId, content: notificationContent, link: `/teacher/my-payouts` }
      });
  
      io.to(teacherId).emit('new_notification', { message: notificationContent, notification: newNotification });
    }

    return updatedPayout;

  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw new AppError(`TeacherPayout with ID ${payoutId} not found`, 404);
    }
    throw new AppError(err.message || 'Failed to update payout', 500);
  }
}