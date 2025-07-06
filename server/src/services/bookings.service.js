import { Prisma, BookingStatus, PaymentMethod, PayoutStatus, SessionStatus, PaymentStatus } from '@prisma/client'
import prisma from '../../libs/prisma.js';
import { startOfDay, endOfDay } from 'date-fns'
import AppError from '../utils/AppError.mjs'; 
import { io } from '../../index.js';

/**
 * GET /api/bookings
 */
export const getAllBookings = async (req, res, next) => {
  try {
    let {
      search,
      status,
      page = 1,
      limit = 8,
      sortBy = "createdAt",
      sortDir = "desc",
    } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    let where = {};
    if (req.user.role === 'TEACHER') {
      where = { course: { teacherId: req.user.id } };
    } else if (req.user.role === 'STUDENT') {
      where = { studentId: req.user.id };
    }

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

    // Total count for pagination
    const total = await prisma.booking.count({ where });

    // Sort
    let orderBy = {};
    if (["createdAt", "id"].includes(sortBy)) {
      orderBy[sortBy] = sortDir === "asc" ? "asc" : "desc";
    } else {
      orderBy.createdAt = "desc";
    }

    // Data fetch
    const bookings = await prisma.booking.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      include: {
        student: {
          select: { id: true, name: true, email: true, phone: true, avatarUrl: true },
        },
        course: {
          select: {
            id: true,
            title: true,
            price: true,
            imageUrl: true,
            teacherId: true,
            teacher: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        sessions: {
          select: {
            id: true,
            sessionDate: true,
            status: true,
            teacherReport: true,
            studentAttendance: true,
            isUnlocked: true,
            sessionCompletedAt: true,
            updatedAt: true
          },
          orderBy: { sessionDate: 'asc' },
        },
        payments: {
          select: { id: true, status: true, amount: true, installmentNumber: true, dueDate: true, proofOfPaymentUrl: true },
          orderBy: { installmentNumber: 'asc' },
        },
        review: true,
        teacherPayouts: true,
      }
    });

    return res.json({
      bookings,
      total,
    });

  } catch (err) {
    console.error('getAllBookings Error:', err);
    next(new AppError(err.message, 500));
  }
};

/**
 * PUT /api/bookings/:bookingId/overall-report
 */
export const submitOverallBookingReport = async (req, res, next) => { //
  const { id: bookingId } = req.params;
  const { overallTeacherReport, finalGrade } = req.body;
  const loggedInTeacherId = req.user.id;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        course: { select: { teacherId: true, price: true } }, 
        payments: { select: { status: true } },
        sessions: {
          select: { status: true, isUnlocked: true }
        }, 
      },
    });

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }
    if (booking.course?.teacherId !== loggedInTeacherId) {
      return next(new AppError('You are not authorized to submit an overall report for this booking', 403));
    }

    const totalCourseSessions = booking.sessions.length;
    const completedSessionsCount = booking.sessions.filter(
      session => session.status === SessionStatus.COMPLETED && session.isUnlocked 
    ).length;


    if (booking.sessions.length < totalCourseSessions) {
        return next(new AppError(`Not all ${totalCourseSessions} sessions for this course have been recorded or scheduled yet. Cannot submit overall report.`, 400));
    }

    const allSessionsHandled = booking.sessions.every(
        session => session.status === SessionStatus.COMPLETED
    );

    if (!allSessionsHandled) {
      return next(new AppError('All sessions must be marked as COMPLETED by the teacher before submitting an overall report.', 400));
    }

    const dataForBookingUpdate = {};
    if (overallTeacherReport !== undefined) dataForBookingUpdate.overallTeacherReport = overallTeacherReport;
    if (finalGrade !== undefined) dataForBookingUpdate.finalGrade = finalGrade;
    
    dataForBookingUpdate.bookingStatus = BookingStatus.COMPLETED;
    if(!booking.courseCompletionDate) {
        dataForBookingUpdate.courseCompletionDate = new Date();
    }


    const allPaymentsPaid = booking.payments.every(p => p.status === PayoutStatus.PAID);

    const result = await prisma.$transaction(async (tx) => {
      const updatedBookingResult = await tx.booking.update({
        where: { id: bookingId },
        data: dataForBookingUpdate,
      });

      return tx.booking.findUnique({
        where: { id: updatedBookingResult.id },
        select: { 
          id: true, studentId: true, courseId: true, address: true, bookingStatus: true,
          paymentMethod: true, totalInstallments: true, overallTeacherReport: true,
          finalGrade: true, courseCompletionDate: true, createdAt: true, updatedAt: true,
          student: { select: { id: true, name: true, email: true, phone: true } },
          course: { select: { id: true, title: true, teacher: { select: { id: true, name: true } } } },
          sessions: { 
            select: { id: true, sessionDate: true, status: true, teacherReport: true, studentAttendance: true, isUnlocked: true, sessionCompletedAt: true, updatedAt: true },
            orderBy: { sessionDate: 'asc' } 
          },
          payments: { 
            select: { id: true, status: true, amount: true, installmentNumber: true, dueDate: true },
            orderBy: { installmentNumber: 'asc' } 
          },
          teacherPayouts: true,
          review: true, 
        },
      });
    });

    res.json(result);
  } catch (err) {
    console.error(`Error submitting overall booking report for booking ID ${bookingId}:`, err);
    next(new AppError(err.message || 'Failed to submit overall booking report', err.statusCode || 500));
  }
};

/**
 * GET /api/bookings/:id
 */
export const getBookingById = async (req, res, next) => {
  const { id: bookingId } = req.params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { 
        id: true,
        studentId: true,
        courseId: true,
        address: true,
        conversationId: true,
        conversation: {select: {id: true}},
        bookingStatus: true,
        paymentMethod: true,
        totalInstallments: true,
        overallTeacherReport: true,
        finalGrade: true,
        courseCompletionDate: true,
        createdAt: true,
        updatedAt: true,
        course: { 
          select: { 
            teacherId: true,
            title: true, 
            price: true,
            teacher: { 
              select: { 
                name: true,
                email: true,
                phone: true,
              } 
            } 
          } 
        },
        student: { 
          select: { 
            id: true, 
            name: true, 
            email: true, 
            phone: true 
          } 
        },
        payments: {
          select: {
            id: true,
            status: true,
            amount: true,
            installmentNumber: true,
            dueDate: true
          }
        },
        sessions: {
          select: {
            id: true,
            sessionDate: true,
            status: true,
            teacherReport: true,
            studentAttendance: true,
            isUnlocked: true,
            sessionCompletedAt: true,
            teacherUploadedFile: true,
          },
          orderBy: { sessionDate: 'asc' }
        },
        review: true,
      },
    });

    if (!booking) {
      return next(new AppError(`Booking with ID ${bookingId} not found`, 404));
    }

    const isOwnerStudent = req.user.role === 'STUDENT' && booking.studentId === req.user.id;
    const isOwnerTeacher = req.user.role === 'TEACHER' && booking.course?.teacherId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (isAdmin || isOwnerStudent || isOwnerTeacher) {
      return res.json(booking);
    }
    
    return next(new AppError('You are not authorized to view this booking', 403));

  } catch (err) {
    console.error(`getBookingById Error (ID: ${bookingId}):`, err);
    next(new AppError(err.message, 500));
  }
};

/**
 * POST /api/bookings
 */
export const createBooking = async (req, res, next) => {
  const {
    courseId,
    studentFullName,
    studentEmail,
    studentPhone,
    address,
    sessionDates,
    paymentMethod,
    installments,
  } = req.body;

  const loggedInUserId = req.user.id;
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { price: true, title: true , teacherId: true },
    });
    if (!course) {
      return next(new AppError(`Course with ID ${courseId} not found`, 404));
    }

    const allowedSessions = [6, 12, 24];
    if (!Array.isArray(sessionDates) || !allowedSessions.includes(sessionDates.length)) {
      return next(new AppError(`Number of sessions must be one of: ${allowedSessions.join(', ')}`, 400));
    }
    for (const dateStr of sessionDates) {
        if (isNaN(new Date(dateStr).getTime())) {
            return next(new AppError(`Invalid date format in sessionDates: ${dateStr}`, 400));
        }
    }

    for (const dateStr of sessionDates) {
        const d = new Date(dateStr);

        // Cek konflik dengan sesi booking yang ada pada waktu yang SAMA PERSIS
        const conflictSession = await prisma.bookingSession.findFirst({
            where: {
                sessionDate: d, 

                status: {
                  not: SessionStatus.COMPLETED
                },

                booking: {
                    course: { teacherId: course.teacherId },
                    bookingStatus: { not: BookingStatus.CANCELLED },
                },
            },
        });
        if (conflictSession) {
            return next(new AppError(`Teacher is already booked on ${dateStr}, please pick another dates or times`, 400));
        }

        // Cek konflik dengan jadwal unavailable guru pada waktu yang SAMA PERSIS
        const conflictUnavailable = await prisma.teacherUnavailableDate.findFirst({
            where: { 
                teacherId: course.teacherId, 
                // Perbaikan: Cek waktu yang eksak
                date: d
            },
        });
        if (conflictUnavailable) {
            return next(new AppError(`Teacher is unavailable on ${dateStr}`, 400));
        }
    }

    const userDataToUpdate = {};
    if (req.user) {
        if (studentFullName && studentFullName !== req.user.name) userDataToUpdate.name = studentFullName;
        if (studentEmail && studentEmail !== req.user.email) userDataToUpdate.email = studentEmail;
        if (studentPhone !== undefined) userDataToUpdate.phone = studentPhone === '' ? null : studentPhone;
    }


    const newBookingWithDetails = await prisma.$transaction(async (tx) => {
      if (Object.keys(userDataToUpdate).length > 0 && req.user) {
        try {
          await tx.user.update({ where: { id: loggedInUserId }, data: userDataToUpdate });
        } catch (userUpdateError) {
          if (userUpdateError instanceof Prisma.PrismaClientKnownRequestError && userUpdateError.code === 'P2002') {
            throw new AppError('The provided email for student update is already in use.', 409);
          }
          throw userUpdateError;
        }
      }

      const newBooking = await tx.booking.create({
        data: {
          studentId: loggedInUserId,
          courseId,
          address,
          sessions: {
            create: sessionDates.map(d => ({ sessionDate: new Date(d) })),
          },
          bookingStatus: BookingStatus.PENDING,
          paymentMethod: paymentMethod,
          totalInstallments: paymentMethod === PaymentMethod.INSTALLMENT ? Number(installments) : null,
        },
      });

      const totalPrice = course.price * sessionDates.length;
      const paymentRecordsToCreate = [];
      if (paymentMethod === PaymentMethod.FULL) {
        paymentRecordsToCreate.push({
          bookingId: newBooking.id,
          installmentNumber: 1,
          amount: totalPrice,
          status: PayoutStatus.PENDING, // Harusnya PaymentStatus.PENDING
        });
      } else if (paymentMethod === PaymentMethod.INSTALLMENT) {
        const numInstallments = Number(installments);
        const installmentAmount = parseFloat((totalPrice / numInstallments).toFixed(2));
        let totalCalculated = 0;

        for (let i = 1; i <= numInstallments; i++) {
          let currentInstallmentAmount = installmentAmount;
          if (i === numInstallments) {
            currentInstallmentAmount = parseFloat((totalPrice - totalCalculated).toFixed(2));
          }
          paymentRecordsToCreate.push({
            bookingId: newBooking.id,
            installmentNumber: i,
            amount: currentInstallmentAmount,
            status: PaymentStatus.PENDING,
          });
          totalCalculated += installmentAmount;
        }
      }

      if (paymentRecordsToCreate.length > 0) {
        await tx.payment.createMany({ data: paymentRecordsToCreate });
      }

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

    // --- BAGIAN 1: KIRIM NOTIFIKASI KE GURU 
    const teacherId = newBookingWithDetails.course.teacherId;
    const studentName = newBookingWithDetails.student.name;
    const courseTitle = newBookingWithDetails.course.title;

    const teacherNotificationContent = `Anda memiliki permintaan booking baru dari ${studentName} untuk kursus "${courseTitle}".`;
    
    // 1a. Simpan notifikasi untuk guru ke DB
    const teacherNotification = await prisma.notification.create({
      data: {
        recipientId: teacherId,
        content: teacherNotificationContent,
        link: `/teacher/bookings`, // Link untuk guru
        type: 'BOOKING_STATUS',
      }
    });

    // 1b. Kirim event real-time ke guru
    io.to(teacherId).emit('new_notification', {
      message: teacherNotificationContent,
      notification: teacherNotification
    });


    // --- BAGIAN 2: KIRIM NOTIFIKASI KE SEMUA ADMIN 
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    if (admins.length > 0) {
      const studentName = newBookingWithDetails.student.name;
      const courseTitle = newBookingWithDetails.course.title;
      const adminNotificationContent = `Booking baru oleh ${studentName} untuk kursus "${courseTitle}" telah dibuat dan menunggu verifikasi pembayaran.`;
      
      // Gunakan perulangan untuk membuat dan mengirim notifikasi satu per satu
      // Ini memastikan kita mendapatkan objek notifikasi yang lengkap untuk setiap admin
      for (const admin of admins) {
        // 1. Buat notifikasi untuk SATU admin, gunakan .create() bukan .createMany()
        const newAdminNotification = await prisma.notification.create({
          data: {
            recipientId: admin.id,
            content: adminNotificationContent,
            link: `/admin/payments`, // Sesuaikan link jika perlu
            type: 'BOOKING_STATUS',
          }
        });

        // 2. Kirim event dengan payload yang lengkap, termasuk objek notifikasi
        io.to(admin.id).emit('new_notification', {
          message: adminNotificationContent,
          notification: newAdminNotification // <-- Sekarang objeknya ada
        });
      }
    }

    res.status(201).json(newBookingWithDetails);

  } catch (err) {
    if (err instanceof AppError) {
        return next(err);
    }
    if (err.statusCode && err.message && !(err instanceof AppError)) {
        return next(new AppError(err.message, err.statusCode));
    }
    console.error(`createBooking Error:`, err);
    next(new AppError(err.message || 'Failed to create booking.', 500));
  }
};

/**
 * PUT /api/bookings/:id
 */
export const updateBooking = async (req, res, next) => {
  const { id: bookingId } = req.params;
  const { bookingStatus: newBookingStatus } = req.body;

  if (!newBookingStatus || !Object.values(BookingStatus).includes(newBookingStatus)) {
    return next(new AppError(`Invalid booking status. Valid statuses are: ${Object.values(BookingStatus).join(', ')}`, 400));
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        studentId: true,
        bookingStatus: true,
        conversationId: true,
        payments: { select: { status: true } },
        course: { select: { teacherId: true } }
      }
    });

    if (!booking) {
      return next(new AppError(`Booking with ID ${bookingId} not found`, 404));
    }


    // Mencegah pembatalan jika sudah ada pembayaran PAID
    if (newBookingStatus === BookingStatus.CANCELLED) {
      const hasPaidPayment = booking.payments.some(payment => payment.status === PaymentStatus.PAID);
      if (hasPaidPayment) {
        return next(new AppError('Cannot cancel booking because a payment has already been made.', 400));
      }
      // Jika student, hanya bisa membatalkan booking yang masih PENDING
      if (req.user.role === 'STUDENT' && booking.bookingStatus !== BookingStatus.PENDING) {
         return next(new AppError('Students can only cancel bookings that are still PENDING.', 403));
      }
    }

    const isAdmin = req.user.role === 'ADMIN';
    const isOwnerStudent = req.user.role === 'STUDENT' && booking.studentId === req.user.id;
    const isOwnerTeacher = req.user.role === 'TEACHER' && booking.course?.teacherId === req.user.id;

    if (!(isAdmin || isOwnerStudent || isOwnerTeacher)) {
      return next(new AppError('You are not authorized to update this booking', 403));
    }
    
    if (req.user.role === 'TEACHER' && booking.bookingStatus === BookingStatus.PENDING && ![BookingStatus.CONFIRMED, BookingStatus.CANCELLED].includes(newBookingStatus)) {
        return next(new AppError(`Teachers can only confirm or cancel a PENDING booking. Current status: ${booking.bookingStatus}`, 400));
    }

    if (req.user.role === 'TEACHER' && (booking.bookingStatus === BookingStatus.COMPLETED || booking.bookingStatus === BookingStatus.CANCELLED)) {
        return next(new AppError(`Cannot change booking status from ${booking.bookingStatus}.`, 400));
    }

    let dataToUpdate = { bookingStatus: newBookingStatus };


    if (newBookingStatus === BookingStatus.CONFIRMED && !booking.conversationId) {
      dataToUpdate.conversation = {
        create: {
          participants: {
            create: [
              { userId: booking.studentId }, 
              { userId: booking.course.teacherId }, 
            ]
          }
        }
      };
    }


    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: dataToUpdate,
      include: { 
        student: { select: { id: true, name: true, email: true, phone: true } },
        course: { select: { id: true, title: true, teacherId: true, teacher: {select: {name: true}} } }, 
        payments: { select: { id: true, status: true, amount: true, installmentNumber: true, dueDate: true }},
        sessions: { 
            select: { id: true, sessionDate: true, status: true, teacherReport: true, studentAttendance: true, isUnlocked: true, sessionCompletedAt: true, updatedAt: true },
            orderBy: { sessionDate: 'asc' } 
        },
        review: true,
      },
    });

    // Kirim notifikasi hanya jika statusnya diubah menjadi CONFIRMED atau CANCELLED
    if (newBookingStatus === 'CONFIRMED' || newBookingStatus === 'CANCELLED') {
      const studentId = updatedBooking.student.id;
      const courseTitle = updatedBooking.course.title;
      const statusText = newBookingStatus === 'CONFIRMED' ? 'dikonfirmasi' : 'dibatalkan';
      
      const notificationContent = `Pemesanan Anda untuk kursus "${courseTitle}" telah ${statusText} oleh instruktur.`;
      
      const newNotification = await prisma.notification.create({
        data: {
          recipientId: studentId,
          content: notificationContent,
          link: `/student/my-bookings`,
          type: 'BOOKING_STATUS',
        }
      });

      io.to(studentId).emit('new_notification', {
        message: notificationContent,
        notification: newNotification 
      });
    }


    return res.json(updatedBooking);

  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return next(new AppError(`Booking with ID ${id} not found for update`, 404));
    }
    next(new AppError(err.message || 'Could not update booking status', 500));
  }
};

/**
 * DELETE /api/bookings/:id
 */
export const deleteBooking = async (req, res, next) => {
  const { id } = req.params;
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return next(new AppError(`Booking with ID ${id} not found`, 404));
    }

    if (
      req.user.role !== 'ADMIN' &&
      !(req.user.role === 'STUDENT' && booking.studentId === req.user.id)
    ) {
      return next(new AppError('You are not authorized to delete this booking', 403));
    }

    if (req.user.role === 'STUDENT' && booking.bookingStatus !== BookingStatus.PENDING) {
      return next(new AppError('Only PENDING bookings can be deleted by students', 403));
    }

    await prisma.booking.delete({ where: { id } });

    return res.status(204).send();
  } catch (err) {
    console.error(`deleteBooking Error (ID: ${id}):`, err);
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return next(new AppError(`Booking with ID ${id} not found for deletion`, 404));
    }
    next(new AppError(err.message, 500));
  }
};
