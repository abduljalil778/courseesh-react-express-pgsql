import { Prisma, BookingStatus, PaymentMethod, PayoutStatus, SessionStatus, PaymentStatus } from '@prisma/client'
import prisma from '../../libs/prisma.js';
import AppError from '../utils/AppError.mjs'; 
import { io } from '../../index.js';


/**
 * Service untuk mengambil semua booking dengan filter, paginasi, dan otorisasi.
 * @param {object} param0 - { user, filters }
 * @returns {Promise<{bookings: Array, total: number}>}
 */
export async function getAllBookingsService({ user, filters = {} }) {
  const {
    search,
    status,
    page = 1,
    limit = 8,
    sortBy = "createdAt",
    sortDir = "desc",
  } = filters;
  const pageInt = parseInt(page);
  const limitInt = parseInt(limit);
  const skip = (pageInt - 1) * limitInt;

  let where = {};
  // Otorisasi berdasarkan peran user
  if (user.role === 'TEACHER') {
    where = { course: { teacherId: user.id } };
  } else if (user.role === 'STUDENT') {
    where = { studentId: user.id };
  }

  // Filter tambahan
  if (search) {
    where.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { student: { name: { contains: search, mode: 'insensitive' } } },
      { course: { title: { contains: search, mode: 'insensitive' } } },
      { student: { email: { contains: search, mode: 'insensitive' } } }
    ];
  }
  if (status) {
    where.bookingStatus = status;
  }

  const total = await prisma.booking.count({ where });

  const orderBy = {};
  if (["createdAt", "id"].includes(sortBy)) {
    orderBy[sortBy] = sortDir === "asc" ? "asc" : "desc";
  } else {
    orderBy.createdAt = "desc";
  }

  const bookings = await prisma.booking.findMany({
    where,
    skip,
    take: limitInt,
    orderBy,
    include: {
      student: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
      course: { select: { id: true, title: true, price: true, imageUrl: true, teacherId: true, teacher: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
      sessions: { select: { id: true, sessionDate: true, status: true, teacherReport: true, studentAttendance: true, isUnlocked: true, sessionCompletedAt: true, updatedAt: true }, orderBy: { sessionDate: 'asc' } },
      payments: { select: { id: true, status: true, amount: true, installmentNumber: true, dueDate: true, proofOfPaymentUrl: true }, orderBy: { installmentNumber: 'asc' } },
      review: true,
    }
  });

  return { bookings, total };
}

/**
 * Service untuk mengambil booking tunggal berdasarkan ID dengan otorisasi.
 * @param {string} bookingId - ID dari booking.
 * @param {object} user - User yang sedang login.
 * @returns {Promise<object>}
 */
export async function getBookingByIdService(bookingId, user) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    // Include semua relasi yang diperlukan
    include: {
        student: true,
        course: { include: { teacher: true } },
        payments: true,
        sessions: true,
        review: true,
        conversation: true
    }
  });

  if (!booking) {
    throw new AppError(`Booking with ID ${bookingId} not found`, 404);
  }

  // Otorisasi
  const isOwnerStudent = user.role === 'STUDENT' && booking.studentId === user.id;
  const isOwnerTeacher = user.role === 'TEACHER' && booking.course?.teacherId === user.id;
  const isAdmin = user.role === 'ADMIN';

  if (!isAdmin && !isOwnerStudent && !isOwnerTeacher) {
    throw new AppError('You are not authorized to view this booking', 403);
  }

  return booking;
}

/**
 * Service untuk membuat booking baru.
 * @param {object} bookingData
 * @param {object} user - Objek user yang login
 * @returns {Promise<object>}
 */
export async function createBookingService(bookingData, user) {
  const { courseId, studentFullName, studentEmail, studentPhone, address, sessionDates, paymentMethod, installments } = bookingData;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { price: true, title: true, teacherId: true },
  });
  if (!course) {
    throw new AppError(`Course with ID ${courseId} not found`, 404);
  }

  // Validasi jumlah sesi
  const allowedSessions = [6, 12, 24];
  if (!Array.isArray(sessionDates) || !allowedSessions.includes(sessionDates.length)) {
    throw new AppError(`Number of sessions must be one of: ${allowedSessions.join(', ')}`, 400);
  }
  for (const dateStr of sessionDates) {
    if (isNaN(new Date(dateStr).getTime())) {
      throw new AppError(`Invalid date format in sessionDates: ${dateStr}`, 400);
    }
  }

  // Validasi konflik jadwal
  for (const dateStr of sessionDates) {
    const d = new Date(dateStr);
    const conflictSession = await prisma.bookingSession.findFirst({
      where: {
        sessionDate: d,
        status: { not: SessionStatus.COMPLETED },
        booking: { course: { teacherId: course.teacherId }, bookingStatus: { not: BookingStatus.CANCELLED } },
      },
    });
    if (conflictSession) {
      throw new AppError(`Teacher is already booked on ${dateStr}, please pick another dates or times`, 400);
    }
    const conflictUnavailable = await prisma.teacherUnavailableDate.findFirst({
      where: { teacherId: course.teacherId, date: d },
    });
    if (conflictUnavailable) {
      throw new AppError(`Teacher is unavailable on ${dateStr}`, 400);
    }
  }

  // Logika update data user yang login
  const userDataToUpdate = {};
  if (user) { 
      if (studentFullName && studentFullName !== user.name) userDataToUpdate.name = studentFullName;
      if (studentEmail && studentEmail !== user.email) userDataToUpdate.email = studentEmail;
      if (studentPhone !== undefined) userDataToUpdate.phone = studentPhone === '' ? null : studentPhone;
  }

  const newBookingWithDetails = await prisma.$transaction(async (tx) => {
    // Perbarui user jika ada perubahan
    if (Object.keys(userDataToUpdate).length > 0) {
      try {
        await tx.user.update({ where: { id: user.id }, data: userDataToUpdate }); 
      } catch (userUpdateError) {
        if (userUpdateError instanceof Prisma.PrismaClientKnownRequestError && userUpdateError.code === 'P2002') {
          throw new AppError('The provided email for student update is already in use.', 409);
        }
        throw userUpdateError;
      }
    }

    // Buat booking
    const newBooking = await tx.booking.create({
      data: {
        studentId: user.id, 
        courseId,
        address,
        sessions: { create: sessionDates.map(d => ({ sessionDate: new Date(d) })) },
        bookingStatus: BookingStatus.PENDING,
        paymentMethod: paymentMethod,
        totalInstallments: paymentMethod === PaymentMethod.INSTALLMENT ? Number(installments) : null,
      },
    });

    // Buat record pembayaran
    const totalPrice = course.price * sessionDates.length;
    const paymentRecordsToCreate = [];
    if (paymentMethod === PaymentMethod.FULL) {
      paymentRecordsToCreate.push({
        bookingId: newBooking.id,
        installmentNumber: 1,
        amount: totalPrice,
        status: PaymentStatus.PENDING,
      });
    } else if (paymentMethod === PaymentMethod.INSTALLMENT) {
      const numInstallments = Number(installments);
      const installmentAmount = parseFloat((totalPrice / numInstallments).toFixed(2));
      let totalCalculated = 0;
      for (let i = 1; i <= numInstallments; i++) {
        let currentInstallmentAmount = (i === numInstallments)
          ? parseFloat((totalPrice - totalCalculated).toFixed(2))
          : installmentAmount;
        paymentRecordsToCreate.push({
          bookingId: newBooking.id, installmentNumber: i,
          amount: currentInstallmentAmount, status: PaymentStatus.PENDING,
        });
        totalCalculated += installmentAmount;
      }
    }
    if (paymentRecordsToCreate.length > 0) {
      await tx.payment.createMany({ data: paymentRecordsToCreate });
    }

    // Ambil detail booking yang baru dibuat untuk dikembalikan
    return tx.booking.findUnique({
      where: { id: newBooking.id },
      include: {
        sessions: { orderBy: { sessionDate: 'asc' } },
        payments: { orderBy: { installmentNumber: 'asc' } },
        course: { select: { title: true, price: true, teacherId: true } },
        student: { select: { name: true, email: true, phone: true } },
      },
    });
  });

  // Logika notifikasi
  const teacherId = newBookingWithDetails.course.teacherId;
  const studentName = newBookingWithDetails.student.name;
  const courseTitle = newBookingWithDetails.course.title;
  const teacherNotificationContent = `Anda memiliki permintaan booking baru dari ${studentName} untuk kursus "${courseTitle}".`;
  
  const teacherNotification = await prisma.notification.create({
    data: { recipientId: teacherId, content: teacherNotificationContent, link: `/teacher/bookings`, type: 'BOOKING_STATUS' }
  });
  io.to(teacherId).emit('new_notification', { message: teacherNotificationContent, notification: teacherNotification });

  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
  if (admins.length > 0) {
    const adminNotificationContent = `Booking baru oleh ${studentName} untuk kursus "${courseTitle}" telah dibuat.`;
    for (const admin of admins) {
      const newAdminNotification = await prisma.notification.create({
        data: { recipientId: admin.id, content: adminNotificationContent, link: `/admin/payments`, type: 'BOOKING_STATUS' }
      });
      io.to(admin.id).emit('new_notification', { message: adminNotificationContent, notification: newAdminNotification });
    }
  }

  // Kembalikan hasil
  return newBookingWithDetails;
}

/**
 * Service untuk memperbarui status booking.
 * @param {string} bookingId
 * @param {string} newBookingStatus
 * @param {object} user
 * @returns {Promise<object>}
 */
export async function updateBookingStatusService(bookingId, newBookingStatus, user) {
  if (!newBookingStatus || !Object.values(BookingStatus).includes(newBookingStatus)) {
    throw new AppError(`Invalid booking status. Valid statuses are: ${Object.values(BookingStatus).join(', ')}`, 400);
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { course: true, payments: true, student: true } });
  if (!booking) throw new AppError(`Booking not found`, 404);

  const isAdmin = user.role === 'ADMIN';
  const isOwnerStudent = user.role === 'STUDENT' && booking.studentId === user.id;
  const isOwnerTeacher = user.role === 'TEACHER' && booking.course?.teacherId === user.id;
  
  if (!isAdmin && !isOwnerStudent && !isOwnerTeacher) throw new AppError('You are not authorized to update this booking', 403);
  if (user.role === 'STUDENT' && booking.bookingStatus !== BookingStatus.PENDING && newBookingStatus === 'CANCELLED') throw new AppError('Students can only cancel PENDING bookings.', 403);
  if (newBookingStatus === BookingStatus.CANCELLED && booking.payments.some(p => p.status === PaymentStatus.PAID)) throw new AppError('Cannot cancel booking with a paid payment.', 400);

  let dataToUpdate = { bookingStatus: newBookingStatus };
  if (newBookingStatus === BookingStatus.CONFIRMED && !booking.conversationId) {
    dataToUpdate.conversation = { create: { participants: { create: [{ userId: booking.studentId }, { userId: booking.course.teacherId }] } } };
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: dataToUpdate,
    include: { student: true, course: { include: { teacher: true } } },
  });

  if (newBookingStatus === 'CONFIRMED' || newBookingStatus === 'CANCELLED') {
    const statusText = newBookingStatus.toLowerCase();
    const notificationContent = `Pemesanan Anda untuk kursus "${updatedBooking.course.title}" telah ${statusText}.`;
    const newNotification = await prisma.notification.create({
      data: { recipientId: updatedBooking.studentId, content: notificationContent, link: `/student/my-bookings`, type: 'BOOKING_STATUS' }
    });
    io.to(updatedBooking.studentId).emit('new_notification', { message: notificationContent, notification: newNotification });
  }

  return updatedBooking;
}

/**
 * Service untuk menghapus booking.
 * @param {string} bookingId
 * @param {object} user
 */
export async function deleteBookingService(bookingId, user) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new AppError(`Booking not found`, 404);

    if (user.role !== 'ADMIN' && !(user.role === 'STUDENT' && booking.studentId === user.id && booking.bookingStatus === 'PENDING')) {
        throw new AppError('You are not authorized to delete this booking', 403);
    }
    await prisma.booking.delete({ where: { id: bookingId } });
}

/**
 * Service untuk guru submit laporan akhir.
 * @param {string} bookingId
 * @param {object} reportData
 * @param {object} user
 * @returns {Promise<object>}
 */
export async function submitOverallReportService(bookingId, reportData, user) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { course: true, sessions: true } });

    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.course.teacherId !== user.id) throw new AppError('You are not authorized for this action', 403);
    if (!booking.sessions.every(s => s.status === SessionStatus.COMPLETED)) throw new AppError('All sessions must be COMPLETED first.', 400);

    let dataToUpdate = { ...reportData, bookingStatus: 'COMPLETED' };
    if (!booking.courseCompletionDate) {
        dataToUpdate.courseCompletionDate = new Date();
    }

    return await prisma.booking.update({ where: { id: bookingId }, data: dataToUpdate });
}


