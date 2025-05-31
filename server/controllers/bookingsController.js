// server/controllers/bookingsController.js
import pkg from '@prisma/client';
const { PrismaClient, Prisma, BookingStatus, PaymentMethod, PaymentStatus: PrismaPaymentStatusEnum } = pkg; // Impor semua enum yang dibutuhkan
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
      include: { // 'include' digunakan untuk relasi
        student: {
          select: { id: true, name: true, email: true, phone: true },
        },
        course: {
          select: {
            id: true,
            title: true,
            price: true,
            teacher: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        sessions: {
          select: { // Field yang ingin diambil dari BookingSession
            id: true,
            sessionDate: true,
            status: true,
            teacherReport: true,
            studentAttendance: true,
            sessionCompletedAt: true,
            updatedAt: true,
          },
          orderBy: { sessionDate: 'asc' },
        },
        payments: {
          select: { id: true, status: true, amount: true, installmentNumber: true, dueDate: true },
          orderBy: { installmentNumber: 'asc' }
        },
      },
      // Field skalar dari Booking (overallTeacherReport, finalGrade, dll.) akan otomatis terambil
      // karena tidak ada klausa 'select' di level utama query ini.
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
export const submitOverallBookingReport = async (req, res, next) => {
  const { id: bookingId } = req.params;
  const { overallTeacherReport, finalGrade } = req.body; // Mungkin juga bookingStatus baru
  const loggedInTeacherId = req.user.id;

  // Validasi Input
  if (overallTeacherReport === undefined && finalGrade === undefined) {
    return next(new AppError('At least overallTeacherReport or finalGrade must be provided.', 400));
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        course: { select: { teacherId: true } },
        // Cek apakah semua sesi sudah COMPLETED sebelum submit overall report (opsional)
        // sessions: { select: { status: true } } 
      },
    });

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    if (booking.course?.teacherId !== loggedInTeacherId) {
      return next(new AppError('You are not authorized to submit an overall report for this booking', 403));
    }

    // Opsional: Cek apakah semua sesi sudah COMPLETED
    // const allSessionsCompleted = booking.sessions.every(s => s.status === SessionStatus.COMPLETED);
    // if (!allSessionsCompleted && !req.user.role === 'ADMIN') { // Admin mungkin bisa override
    //   return next(new AppError('Not all sessions are completed. Cannot submit overall report yet.', 400));
    // }

    const dataToUpdate = {};
    if (overallTeacherReport !== undefined) dataToUpdate.overallTeacherReport = overallTeacherReport;
    if (finalGrade !== undefined) dataToUpdate.finalGrade = finalGrade;
    
    // Mungkin juga update bookingStatus ke COMPLETED atau sejenisnya dan courseCompletionDate
    dataToUpdate.bookingStatus = BookingStatus.COMPLETED; // Ganti dengan status yang sesuai
    dataToUpdate.courseCompletionDate = new Date();

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: dataToUpdate,
      // Include data yang relevan untuk respons
      include: {
        student: { select: {id: true, name: true, email: true, phone: true}},
        course: {select: {id: true, title: true}},
        sessions: {orderBy: {sessionDate: 'asc'}},
        payments: {orderBy: {installmentNumber: 'asc'}}
      }
    });

    res.json(updatedBooking);
  } catch (err) {
    console.error(`Error submitting overall booking report for booking ID ${bookingId}:`, err);
    next(new AppError(err.message || 'Failed to submit overall booking report', 500));
  }
};

/**
 * GET /api/bookings/:id
 */
export const getBookingById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        course: { include: { teacher: true } },
        student: { select: { id: true, name: true, email: true, phone: true } },
        payments: true,
        sessions: { orderBy: { sessionDate: 'asc' } },
      },
    });

    if (!booking) {
      return next(new AppError(`Booking with ID ${id} not found`, 404));
    }

    if (
      req.user.role === 'ADMIN' ||
      (req.user.role === 'STUDENT' && booking.studentId === req.user.id) ||
      (req.user.role === 'TEACHER' && booking.course.teacherId === req.user.id)
    ) {
      return res.json(booking);
    }
    return next(new AppError('You are not authorized to view this booking', 403));
  } catch (err) {
    console.error(`getBookingById Error (ID: ${id}):`, err);
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

  // --- Validasi Input Dasar (Idealnya dengan express-validator) ---
  if (!courseId || !studentFullName || !studentEmail || !address || !sessionDates || !paymentMethod) {
    return next(new AppError('Missing required fields (courseId, studentFullName, studentEmail, address, sessionDates, paymentMethod required)', 400));
  }
  if (paymentMethod === PaymentMethod.INSTALLMENT && (!installments || Number(installments) < 2 || Number(installments) > 6 /* Sesuaikan batas max cicilan */)) {
    return next(new AppError('Number of installments must be a number between 2 and (misal) 6 for installment payment', 400));
  }

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
export const updateBooking = async (req, res, next) => {
  const { id } = req.params; // ID Booking yang akan diupdate
  const { bookingStatus } = req.body; // Status baru dari request body

  // Validasi input untuk bookingStatus
  if (!bookingStatus || !Object.values(BookingStatus).includes(bookingStatus)) {
    return next(new AppError(`Invalid booking status. Valid statuses are: ${Object.values(BookingStatus).join(', ')}`, 400));
  }

  try {
    // 1. Ambil booking beserta informasi kursus (untuk mendapatkan teacherId)
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        course: { // Include course untuk mendapatkan teacherId
          select: { teacherId: true } // Cukup pilih teacherId jika hanya itu yang dibutuhkan untuk otorisasi
        }
      }
    });

    // 2. Jika booking tidak ditemukan
    if (!booking) {
      return next(new AppError(`Booking with ID ${id} not found`, 404));
    }

    // 3. Logika Otorisasi
    const isAdmin = req.user.role === 'ADMIN';
    const isOwnerStudent = req.user.role === 'STUDENT' && booking.studentId === req.user.id;
    const isOwnerTeacher = req.user.role === 'TEACHER' && booking.course?.teacherId === req.user.id;

    if (!(isAdmin || isOwnerStudent || isOwnerTeacher)) {
      // Jika bukan admin, bukan student pemilik, dan bukan teacher pemilik kursus
      return next(new AppError('You are not authorized to update this booking', 403));
    }

    // 4. Lakukan update jika otorisasi berhasil
    const updatedBooking = await prisma.booking.update({
      where: { id: id }, // Gunakan id dari req.params
      data: { bookingStatus: bookingStatus }, // Gunakan variabel yang sudah divalidasi
      include: { // Sertakan data yang relevan untuk respons
        student: { select: { id: true, name: true, email: true, phone: true } },
        course: { select: { id: true, title: true } },
        payments: true, // Menggunakan 'payments' (plural) sesuai skema
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