// server/controllers/paymentController.js
import pkg from '@prisma/client';
import AppError from '../utils/AppError.mjs';
const { PrismaClient, Prisma, PaymentStatus, BookingStatus, PaymentMethod } = pkg; // Impor PaymentStatus dan Prisma
const prisma = new PrismaClient();

/**
 * GET /api/payments
 * ADMIN only: Mengambil semua record Payment (cicilan individual atau pembayaran penuh)
 * Pertimbangkan filter berdasarkan bookingId, studentId, status, dll.
 */
export const getAllPayments = async (req, res, next) => {
  try {
    // Contoh: admin bisa filter payments berdasarkan bookingId jika diberikan query param
    const { bookingId: queryBookingId } = req.query;
    const whereClause = {};
    if (queryBookingId) {
        whereClause.bookingId = queryBookingId;
    }

    const payments = await prisma.payment.findMany({
      where: whereClause, // Terapkan filter jika ada
      include: {
        booking: {
          select: {
            id: true,
            student: { select: { id: true, name: true, email: true, phone: true } },
            course: { select: { id: true, title: true, price: true } },
            paymentMethod: true, // Tampilkan metode pembayaran dari booking
            totalInstallments: true, // Tampilkan total cicilan dari booking
          },
        },
      },
      orderBy: [ // Urutkan
        { bookingId: 'asc' },
        { installmentNumber: 'asc' }
      ]
    });
    return res.json(payments);
  } catch (err) {
    console.error('getAllPayments Error:', err);
    next(new AppError(err.message));
  }
};

/**
 * GET /api/payments/:id
 * ADMIN only: Mengambil satu record Payment (cicilan) berdasarkan ID uniknya.
 */
export const getPaymentById = async (req, res, next) => {
  const { id } = req.params; // Ini adalah ID dari record Payment (cicilan)
  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
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
      return new AppError({ message: `Payment record with ID ${id} not found` });
    }
    return res.json(payment);
  } catch (err) {
    console.error(`getPaymentById Error (ID: ${id}):`, err);
    next(new AppError(err.message));
  }
};

/**
 * POST /api/payments (MEMBUAT RECORD PAYMENT/CICILAN MANUAL)
 * ADMIN only
 * Endpoint ini mungkin kurang relevan jika semua cicilan dibuat saat booking.
 * Jika tetap ada, ini untuk admin menambahkan record pembayaran/cicilan secara manual.
 * Body: { bookingId, installmentNumber, amount, dueDate?, status? }
 */
export const createPayment = async (req, res, next) => {
  const { bookingId, installmentNumber, amount, dueDate, status } = req.body;

  try {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return new AppError({ message: `Booking with ID ${bookingId} not found` });
    }

    // Cek apakah cicilan dengan nomor tersebut sudah ada untuk booking ini (opsional)
    const existingInstallment = await prisma.payment.findFirst({
        where: { bookingId, installmentNumber: Number(installmentNumber) }
    });
    if (existingInstallment) {
        return new AppError({ message: `Installment number ${installmentNumber} already exists for this booking.`});
    }


    const payment = await prisma.payment.create({
      data: {
        bookingId,
        installmentNumber: Number(installmentNumber),
        amount: Number(amount),
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || PaymentStatus.PENDING,
      },
    });
    return res.status(201).json(payment);
  } catch (err) {
    console.error('createPayment Error:', err);
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') { // Foreign key constraint failed
        return new AppError({ message: `Invalid bookingId: ${bookingId}` });
    }
    next(new AppError(err.message));
  }
};

/**
 * PUT /api/payments/:id
 * ADMIN only: Memperbarui satu record Payment (cicilan), terutama statusnya.
 * Body: { status?, amount?, dueDate?, paidAt? }
 */
export const updatePayment = async (req, res, next) => {
  const { id: paymentId } = req.params;
  const { status, amount, dueDate, } = req.body;

  const dataToUpdate = {};
  if (status !== undefined) {
    if (!Object.values(PaymentStatus).includes(status)) {
        return new AppError({ message: `Invalid payment status. Valid are: ${Object.values(PaymentStatus).join(', ')}` });
    }
    dataToUpdate.status = status;
  }
  if (amount !== undefined) dataToUpdate.amount = parseFloat(amount);
  if (dueDate !== undefined) dataToUpdate.dueDate = dueDate ? new Date(dueDate) : null;
  // if (paidAt !== undefined) dataToUpdate.paidAt = paidAt ? new Date(paidAt) : null;
  // Anda bisa menambahkan field lain yang relevan untuk diupdate di sini

  if (Object.keys(dataToUpdate).length === 0) {
    return next(new AppError('No fields provided for update', 400));
  }

  try {
    const updatedPayment = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { id: paymentId },
        data: dataToUpdate,
        include: { // Include booking untuk mendapatkan detail kursus dan pembayaran lain
          booking: {
            include: {
              course: { select: { numberOfSessions: true } },
              payments: { select: { status: true } },
              sessions: { select: { id: true, sessionDate: true }, orderBy: { sessionDate: 'asc' } }
            }
          }
        }
      });

      // Logika untuk membuka sesi jika pembayaran LUNAS dan metode adalah CICILAN
      if (payment.status === PaymentStatus.PAID && payment.booking.paymentMethod === PaymentMethod.INSTALLMENT) {
        const bookingDetails = payment.booking;
        const totalCourseSessions = bookingDetails.course.numberOfSessions;
        const totalInstallmentsInBooking = bookingDetails.totalInstallments;

        if (totalCourseSessions > 0 && totalInstallmentsInBooking > 0) {
          const paidInstallmentsCount = bookingDetails.payments.filter(p => p.status === PaymentStatus.PAID).length;
          
          // Jumlah sesi yang terbuka per cicilan (akan bulat karena angka sesi dan cicilan sudah standar)
          const sessionsPerInstallmentPaid = totalCourseSessions / totalInstallmentsInBooking;
          const cumulativeSessionsToUnlock = sessionsPerInstallmentPaid * paidInstallmentsCount;

          const sessionIdsToUnlock = bookingDetails.sessions
            .slice(0, Math.min(cumulativeSessionsToUnlock, bookingDetails.sessions.length)) // Pastikan tidak melebihi jumlah sesi aktual
            .map(s => s.id);

          if (sessionIdsToUnlock.length > 0) {
            await tx.bookingSession.updateMany({
              where: {
                bookingId: bookingDetails.id,
                id: { in: sessionIdsToUnlock }
              },
              data: { isUnlocked: true }
            });
          }

          // Jika semua cicilan sudah lunas & semua sesi telah dibuka, 
          // dan booking masih PENDING/CONFIRMED, mungkin update status booking menjadi CONFIRMED jika sebelumnya PENDING
          // atau biarkan guru yang mengubahnya jadi COMPLETED nanti.
          const allInstallmentsPaid = bookingDetails.payments.every(p => p.status === PaymentStatus.PAID);
          if (allInstallmentsPaid && bookingDetails.bookingStatus === BookingStatus.PENDING) {
             // Opsional: Otomatis konfirmasi booking jika semua lunas & status masih pending.
             // await tx.booking.update({
             //   where: { id: bookingDetails.id },
             //   data: { bookingStatus: BookingStatus.CONFIRMED }
             // });
          }
        }
      } else if (payment.status === PaymentStatus.PAID && payment.booking.paymentMethod === PaymentMethod.FULL) {
        // Jika pembayaran penuh lunas, buka semua sesi
        await tx.bookingSession.updateMany({
            where: { bookingId: payment.bookingId },
            data: { isUnlocked: true }
        });
        // Opsional: Otomatis konfirmasi booking jika PENDING
        // if (payment.booking.bookingStatus === BookingStatus.PENDING) {
        //     await tx.booking.update({
        //         where: { id: payment.bookingId },
        //         data: { bookingStatus: BookingStatus.CONFIRMED }
        //     });
        // }
      }
      // Penting untuk mengembalikan payment yang sudah diupdate, atau data yang relevan
      return payment; 
    }); // Akhir transaksi

    // Ambil kembali payment yang diupdate dengan relasi yang mungkin berubah
    // untuk respons yang akurat, atau cukup kembalikan hasil transaksi.
    // Ini contoh sederhana:
    const finalPaymentDetails = await prisma.payment.findUnique({
        where: {id: updatedPayment.id},
        include: { booking: { include: { course: true, student: true, sessions: true, payments: true }}}
    });

    return res.json(finalPaymentDetails);
  } catch (err) {
    console.error(`updatePayment Error (ID: ${paymentId}):`, err);
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return next(new AppError(`Payment record with ID ${paymentId} not found`, 404));
    }
    next(new AppError(err.message || 'Could not update payment', 500));
  }
};

/**
 * DELETE /api/payments/:id
 * ADMIN only: Menghapus satu record Payment (cicilan).
 * Pertimbangkan konsekuensinya terhadap status booking keseluruhan.
 */
export const deletePayment = async (req, res, next) => {
  const { id } = req.params; // ID dari record Payment (cicilan)
  try {
    await prisma.payment.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    console.error(`deletePayment Error (ID: ${id}):`, err);
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return new AppError({ message: `Payment record with ID ${id} not found` });
    }
    next(new AppError(err.message));
  }
};