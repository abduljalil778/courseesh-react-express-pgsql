import { Prisma, PaymentStatus, BookingStatus, PaymentMethod } from '@prisma/client';
import AppError from '../utils/AppError.mjs';
import prisma from '../../libs/prisma.js';
import { io } from '../../index.js';

/**
 * Service untuk mengambil semua record Payment.
 * @param {object} filters - Opsi filter seperti { bookingId }.
 * @returns {Promise<Array>}
 */
export async function getAllPaymentsService(filters = {}) {
  const { bookingId: queryBookingId } = filters;
  const whereClause = {};
  if (queryBookingId) {
      whereClause.bookingId = queryBookingId;
  }

  return await prisma.payment.findMany({
    where: whereClause,
    include: {
      booking: {
        select: {
          id: true,
          student: { select: { id: true, name: true, email: true, phone: true } },
          course: { select: { id: true, title: true, price: true } },
          paymentMethod: true,
          totalInstallments: true,
        },
      },
    },
    orderBy: [{ bookingId: 'asc' }, { installmentNumber: 'asc' }]
  });
}

/**
 * Service untuk mengambil satu record Payment berdasarkan ID-nya.
 * @param {string} paymentId - ID dari record Payment.
 * @returns {Promise<object>}
 */
export async function getPaymentByIdService(paymentId) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        include: {
          student: { select: { id: true, name: true, email: true, phone: true } },
          course: { select: { id: true, title: true, price: true } },
        },
      },
    },
  });
  if (!payment) {
    throw new AppError(`Payment record with ID ${paymentId} not found`, 404);
  }
  return payment;
}

/**
 * Service untuk membuat record Payment secara manual (Admin).
 * @param {object} paymentData - Data untuk payment baru.
 * @returns {Promise<object>}
 */
export async function createPaymentService(paymentData) {
  const { bookingId, installmentNumber, amount, dueDate, status } = paymentData;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    throw new AppError(`Booking with ID ${bookingId} not found`, 404);
  }

  const existingInstallment = await prisma.payment.findFirst({
      where: { bookingId, installmentNumber: Number(installmentNumber) }
  });
  if (existingInstallment) {
      throw new AppError(`Installment number ${installmentNumber} already exists for this booking.`, 400);
  }

  try {
    return await prisma.payment.create({
      data: {
        bookingId,
        installmentNumber: Number(installmentNumber),
        amount: Number(amount),
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || PaymentStatus.PENDING,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new AppError(`Invalid bookingId: ${bookingId}`, 400);
    }
    throw new AppError(err.message);
  }
}

/**
 * Service untuk memperbarui record Payment, terutama statusnya.
 * @param {string} paymentId - ID dari Payment yang akan diupdate.
 * @param {object} dataToUpdate - Data yang akan diupdate.
 * @returns {Promise<object>}
 */
export async function updatePaymentService(paymentId, dataToUpdate) {
  if (dataToUpdate.status && !Object.values(PaymentStatus).includes(dataToUpdate.status)) {
    throw new AppError(`Invalid payment status. Valid are: ${Object.values(PaymentStatus).join(', ')}`, 400);
  }

  const updatedPayment = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { id: paymentId },
      data: dataToUpdate,
      include: { 
        booking: {
          include: {
            payments: { select: { status: true } },
            sessions: { select: { id: true, sessionDate: true }, orderBy: { sessionDate: 'asc' } }
          }
        }
      }
    });

    // Logika untuk membuka sesi setelah pembayaran
    const bookingDetails = payment.booking;
    if (payment.status === PaymentStatus.PAID) {
      if (bookingDetails.paymentMethod === PaymentMethod.INSTALLMENT) {
        const paidInstallmentsCount = bookingDetails.payments.filter(p => p.status === PaymentStatus.PAID).length;
        const sessionsPerInstallmentPaid = bookingDetails.sessions.length / bookingDetails.totalInstallments;
        const cumulativeSessionsToUnlock = Math.min(sessionsPerInstallmentPaid * paidInstallmentsCount, bookingDetails.sessions.length);
        const sessionIdsToUnlock = bookingDetails.sessions.slice(0, cumulativeSessionsToUnlock).map(s => s.id);
        
        if (sessionIdsToUnlock.length > 0) {
          await tx.bookingSession.updateMany({ where: { id: { in: sessionIdsToUnlock } }, data: { isUnlocked: true } });
        }
      } else if (bookingDetails.paymentMethod === PaymentMethod.FULL) {
        await tx.bookingSession.updateMany({ where: { bookingId: payment.bookingId }, data: { isUnlocked: true } });
      }
    }
    return payment;
  });

  const finalPaymentDetails = await prisma.payment.findUnique({
      where: { id: updatedPayment.id },
      include: { booking: { include: { course: true, student: { select: { id: true, name: true, avatarUrl: true } } } } }
  });

  // Kirim notifikasi jika status diubah menjadi PAID
  if (dataToUpdate.status === PaymentStatus.PAID && finalPaymentDetails) {
    const { student, course, id: bookingId } = finalPaymentDetails.booking;
    const notificationContent = `Pembayaran Anda untuk kursus "${course.title}" telah dikonfirmasi.`;
    const newNotification = await prisma.notification.create({
      data: {
        recipientId: student.id,
        content: notificationContent,
        link: `/student/my-courses/${bookingId}`,
        type: 'PAYMENT_STATUS'
      }
    });
    io.to(student.id).emit('new_notification', { message: notificationContent, notification: newNotification });
  }

  return finalPaymentDetails;
}

/**
 * Service untuk menghapus satu record Payment.
 * @param {string} paymentId - ID dari Payment.
 */
export async function deletePaymentService(paymentId) {
  try {
    await prisma.payment.delete({ where: { id: paymentId } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw new AppError(`Payment record with ID ${paymentId} not found`, 404);
    }
    throw new AppError(err.message);
  }
}

/**
 * Service untuk mengunggah bukti pembayaran.
 * @param {string} paymentId - ID dari Payment.
 * @param {string} studentId - ID dari siswa yang mengunggah.
 * @param {object} file - Objek file dari multer.
 * @returns {Promise<object>}
 */
export async function uploadProofOfPaymentService(paymentId, studentId, file) {
  if (!file) {
    throw new AppError('No file uploaded.', 400);
  }

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, booking: { studentId: studentId } }
  });

  if (!payment) {
    throw new AppError('Payment record not found or you are not authorized.', 404);
  }
  
  const fileUrl = `/uploads/${file.filename}`;
  return await prisma.payment.update({
    where: { id: paymentId },
    data: { proofOfPaymentUrl: fileUrl }
  });
}