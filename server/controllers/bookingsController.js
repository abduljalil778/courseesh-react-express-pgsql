// server/controllers/bookingsController.js
import pkg from '@prisma/client';
const { PrismaClient, Prisma, BookingStatus, PaymentMethod, PayoutStatus, SessionStatus, PaymentStatus: PrismaPaymentStatusEnum } = pkg;
const prisma = new PrismaClient();
import AppError from '../utils/AppError.mjs'; 

/**
 * GET /api/bookings
 */
export const getAllBookings = async (req, res, next) => {
  try {
    let where = {};
    if (req.user.role === 'TEACHER') {
      where = { course: { teacherId: req.user.id } };
    } else if (req.user.role === 'STUDENT') {
      where = { studentId: req.user.id };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, email: true, phone: true },
        },
        course: {
          select: {
            id: true,
            title: true,
            price: true,
            numberOfSessions: true, // <--- TAMBAHKAN INI
            teacherId: true, // Anda juga butuh ini untuk `submitOverallBookingReport`
            teacher: {
              select: { id: true, name: true, email: true },
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
          select: { id: true, status: true, amount: true, installmentNumber: true, dueDate: true },
          orderBy: { installmentNumber: 'asc' },
        },
        review: true, 
        teacherPayout: true 
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json(bookings);
  } catch (err) {
    console.error('getAllBookings Error:', err);
    next(new AppError(err.message, 500));
  }
};

/**
 * PUT /api/bookings/:bookingId/overall-report
 * Teacher submits an overall report for a booking.
 */
export const submitOverallBookingReport = async (req, res, next) => { //
  const { id: bookingId } = req.params;
  const { overallTeacherReport, finalGrade } = req.body;
  const loggedInTeacherId = req.user.id;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        course: { select: { teacherId: true, price: true, numberOfSessions: true } }, // Ambil numberOfSessions dari course
        payments: { select: { status: true } },
        sessions: { // Ambil semua sesi untuk validasi
          select: { status: true, isUnlocked: true } // Ambil status dan isUnlocked dari setiap sesi
        }, 
      },
    });

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }
    if (booking.course?.teacherId !== loggedInTeacherId) {
      return next(new AppError('You are not authorized to submit an overall report for this booking', 403));
    }

    // Cek apakah semua sesi sudah selesai
    const totalCourseSessions = booking.course.numberOfSessions;
    const completedSessionsCount = booking.sessions.filter(
      session => session.status === SessionStatus.COMPLETED && session.isUnlocked 
    ).length;


    if (booking.sessions.length < totalCourseSessions) {
        return next(new AppError(`Not all ${totalCourseSessions} sessions for this course have been recorded or scheduled yet. Cannot submit overall report.`, 400));
    }

    const allSessionsHandled = booking.sessions.every(
        // Definisi "ditangani": bisa COMPLETED, atau status akhir lainnya seperti CANCELLED_STUDENT, STUDENT_ABSENT
        // Namun, untuk overall report, biasanya kita ingin semua sesi yang seharusnya terjadi sudah COMPLETED oleh guru.
        session => session.status === SessionStatus.COMPLETED
    );

    if (!allSessionsHandled) {
      return next(new AppError('All sessions must be marked as COMPLETED by the teacher before submitting an overall report.', 400));
    }
    // --- AKHIR VALIDASI BARU ---


    const dataForBookingUpdate = {};
    if (overallTeacherReport !== undefined) dataForBookingUpdate.overallTeacherReport = overallTeacherReport;
    if (finalGrade !== undefined) dataForBookingUpdate.finalGrade = finalGrade;
    
    // Status booking otomatis menjadi COMPLETED saat overall report disubmit jika semua sesi sudah COMPLETED.
    dataForBookingUpdate.bookingStatus = BookingStatus.COMPLETED;
    if(!booking.courseCompletionDate) { // Hanya set jika belum ada
        dataForBookingUpdate.courseCompletionDate = new Date();
    }


    const allPaymentsPaid = booking.payments.every(p => p.status === PrismaPaymentStatusEnum.PAID);

    const result = await prisma.$transaction(async (tx) => {
      const updatedBookingResult = await tx.booking.update({
        where: { id: bookingId },
        data: dataForBookingUpdate,
      });

      // Logika pembuatan TeacherPayout tetap sama
      if (updatedBookingResult.bookingStatus === BookingStatus.COMPLETED && allPaymentsPaid) {
        const existingPayout = await tx.teacherPayout.findUnique({
          where: { bookingId: booking.id },
        });

        if (!existingPayout) {
          // ... (logika pembuatan payout seperti sebelumnya) ...
          let serviceFeePercentageString = process.env.DEFAULT_SERVICE_FEE_PERCENTAGE || '0.15';
          let serviceFeePercentage = parseFloat(serviceFeePercentageString);
          
          const feeSetting = await tx.applicationSetting.findUnique({ where: { key: "DEFAULT_SERVICE_FEE_PERCENTAGE" } });
          if (feeSetting && !isNaN(parseFloat(feeSetting.value))) {
            serviceFeePercentage = parseFloat(feeSetting.value);
          }

          const coursePrice = booking.course.price;
          const serviceFeeAmount = parseFloat((coursePrice * serviceFeePercentage).toFixed(2));
          const honorariumAmount = parseFloat((coursePrice - serviceFeeAmount).toFixed(2));

          await tx.teacherPayout.create({
            data: {
              bookingId: booking.id,
              teacherId: booking.course.teacherId,
              coursePriceAtBooking: coursePrice,
              serviceFeePercentage,
              serviceFeeAmount,
              honorariumAmount,
              status: PayoutStatus.PENDING_PAYMENT,
            },
          });
        }
      }

      // Ambil kembali booking dengan semua detailnya untuk respons
      // (Gunakan select eksplisit seperti yang sudah diperbaiki sebelumnya)
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
          teacherPayout: true,
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
            numberOfSessions: true,
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
        sessions: {
          select: {
            id: true,
            sessionDate: true,
            status: true,
            teacherReport: true,
            studentAttendance: true,
            isUnlocked: true,
            sessionCompletedAt: true
          },
          orderBy: { sessionDate: 'asc' }
        },
        review: true,
      },
    });

    if (!booking) {
      return next(new AppError(`Booking with ID ${bookingId} not found`, 404));
    }

    // --- LOGIKA OTORISASI YANG DIPERBAIKI ---
    const isOwnerStudent = req.user.role === 'STUDENT' && booking.studentId === req.user.id;
    const isOwnerTeacher = req.user.role === 'TEACHER' && booking.course?.teacherId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (isAdmin || isOwnerStudent || isOwnerTeacher) {
      return res.json(booking);
    }
    
    // Jika tidak ada kondisi yang terpenuhi, baru lempar error 403
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
    paymentMethod, // Ini adalah enum PaymentMethod
    installments,  // Ini adalah jumlah cicilan (angka)
  } = req.body;

  const loggedInUserId = req.user.id;
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { price: true, numberOfSessions: true, title: true },
    });
    if (!course) {
      return next(new AppError(`Course with ID ${courseId} not found`, 404));
    }

    if (!Array.isArray(sessionDates) || sessionDates.length !== course.numberOfSessions) {
      return next(new AppError(`You must pick exactly ${course.numberOfSessions} session date(s). Received ${sessionDates?.length || 0}.`, 400));
    }
    for (const dateStr of sessionDates) {
        if (isNaN(new Date(dateStr).getTime())) {
            return next(new AppError(`Invalid date format in sessionDates: ${dateStr}`, 400));
        }
    }

    const userDataToUpdate = {};
    // Asumsi req.user sudah ada dan terisi dari middleware auth
    if (req.user) {
        if (studentFullName && studentFullName !== req.user.name) userDataToUpdate.name = studentFullName;
        if (studentEmail && studentEmail !== req.user.email) userDataToUpdate.email = studentEmail; // Perlu penanganan khusus jika email ini sudah terdaftar
        if (studentPhone !== undefined) userDataToUpdate.phone = studentPhone === '' ? null : studentPhone;
    }


    const newBookingWithDetails = await prisma.$transaction(async (tx) => {
      if (Object.keys(userDataToUpdate).length > 0 && req.user) { // Cek juga req.user
        try {
          await tx.user.update({ where: { id: loggedInUserId }, data: userDataToUpdate });
        } catch (userUpdateError) {
          if (userUpdateError instanceof Prisma.PrismaClientKnownRequestError && userUpdateError.code === 'P2002') {
            // Menggunakan AppError untuk dilempar, bukan objek biasa
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

      const paymentRecordsToCreate = [];
      if (paymentMethod === PaymentMethod.FULL) {
        paymentRecordsToCreate.push({
          bookingId: newBooking.id,
          installmentNumber: 1,
          amount: course.price,
          status: PrismaPaymentStatusEnum.PENDING, // Gunakan enum dari Prisma
        });
      } else if (paymentMethod === PaymentMethod.INSTALLMENT) {
        const numInstallments = Number(installments);
        const installmentAmount = parseFloat((course.price / numInstallments).toFixed(2));
        let totalCalculated = 0;

        for (let i = 1; i <= numInstallments; i++) {
          let currentInstallmentAmount = installmentAmount;
          if (i === numInstallments) {
            currentInstallmentAmount = parseFloat((course.price - totalCalculated).toFixed(2));
          }
          paymentRecordsToCreate.push({
            bookingId: newBooking.id,
            installmentNumber: i,
            amount: currentInstallmentAmount,
            status: PrismaPaymentStatusEnum.PENDING, // Gunakan enum dari Prisma
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
          course: { select: { title: true, price: true } },
          student: { select: { name: true, email: true, phone: true } },
        },
      });
    });

    res.status(201).json(newBookingWithDetails);

  } catch (err) {
    // Cek apakah error adalah instance dari AppError
    if (err instanceof AppError) {
        return next(err); // Teruskan AppError ke global error handler
    }
    // Untuk error yang dilempar sebagai objek dari transaksi
    if (err.statusCode && err.message && !(err instanceof AppError)) {
        return next(new AppError(err.message, err.statusCode));
    }
    console.error(`createBooking Error:`, err);
    next(new AppError(err.message || 'Failed to create booking.', 500)); // Default ke 500 jika tidak ada status code
  }
};

/**
 * PUT /api/bookings/:id
 */
export const updateBooking = async (req, res, next) => { //
  const { id: bookingId } = req.params;
  const { bookingStatus: newBookingStatus } = req.body; // Ganti nama variabel agar lebih jelas

  if (!newBookingStatus || !Object.values(BookingStatus).includes(newBookingStatus)) {
    return next(new AppError(`Invalid booking status. Valid statuses are: ${Object.values(BookingStatus).join(', ')}`, 400));
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        course: { select: { teacherId: true } },
        payments: { select: { status: true } } // Pastikan payments di-include
      }
    });

    if (!booking) {
      return next(new AppError(`Booking with ID ${bookingId} not found`, 404));
    }

    // Mencegah pembatalan jika sudah ada pembayaran PAID
    if (newBookingStatus === BookingStatus.CANCELLED) {
      const hasPaidPayment = booking.payments.some(payment => payment.status === PrismaPaymentStatusEnum.PAID);
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
    
    // Khusus untuk Teacher, mungkin hanya bisa CONFIRMED atau CANCELLED dari PENDING.
    // Atau COMPLETED dari CONFIRMED (tapi ini biasanya via overall report).
    if (req.user.role === 'TEACHER' && booking.bookingStatus === BookingStatus.PENDING && ![BookingStatus.CONFIRMED, BookingStatus.CANCELLED].includes(newBookingStatus)) {
        return next(new AppError(`Teachers can only confirm or cancel a PENDING booking. Current status: ${booking.bookingStatus}`, 400));
    }
    // Teacher tidak boleh mengubah status yang sudah COMPLETED atau CANCELLED olehnya sendiri.
    if (req.user.role === 'TEACHER' && (booking.bookingStatus === BookingStatus.COMPLETED || booking.bookingStatus === BookingStatus.CANCELLED)) {
        return next(new AppError(`Cannot change booking status from ${booking.bookingStatus}.`, 400));
    }


    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { bookingStatus: newBookingStatus },
      include: { 
        student: { select: { id: true, name: true, email: true, phone: true } },
        course: { select: { id: true, title: true, teacherId: true, teacher: {select: {name: true}} } }, // Sertakan teacherId dan teacher.name
        payments: { select: { id: true, status: true, amount: true, installmentNumber: true, dueDate: true }},
        sessions: { 
            select: { id: true, sessionDate: true, status: true, teacherReport: true, studentAttendance: true, isUnlocked: true, sessionCompletedAt: true, updatedAt: true },
            orderBy: { sessionDate: 'asc' } 
        },
        review: true,
      },
    });

    return res.json(updatedBooking);

  } catch (err) {
    console.error(`updateBooking Error (ID: ${id}):`, err);
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      // Error "Record to update not found" dari Prisma
      return next(new AppError(`Booking with ID ${id} not found for update`, 404));
    }
    // Untuk error lainnya
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

    // Prisma akan menghapus BookingSession dan Payment yang berelasi jika onDelete: Cascade diset di skema.
    // Jika tidak, Anda perlu menghapusnya secara manual dalam transaksi.
    // Asumsi onDelete: Cascade ada atau Anda akan menanganinya.
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