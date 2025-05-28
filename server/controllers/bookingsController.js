// server/controllers/bookingsController.js
import pkg, { BookingStatus } from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

/**
 * GET /api/bookings
 * STUDENT → own bookings
 * TEACHER → bookings for their courses
 * ADMIN   → all bookings
 */
export const getAllBookings = async (req, res) => {
  try {
    let where = {};
    if (req.user.role === 'TEACHER') {
      where = {
        course: { is: { teacherId: req.user.id } }
      };
    } else if (req.user.role === 'STUDENT') {
      where = { studentId: req.user.id };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        course: {
          select: {
            id: true,
            title: true,
            price: true,
            teacher: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        sessions: {
          select: { sessionDate: true }
        }
      }
    });

    return res.json(bookings);
  } catch (err) {
    console.error('getAllBookings:', err);
    return res.status(500).json({ message: 'Server error fetching bookings' });
  }
};


/**
 * GET /api/bookings/:id
 * Role-based check inside
 */
export const getBookingById = async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        course: { include: { teacher: true } },
        student: { select: { id: true, name: true, email: true } },
        payment: true
      }
    });
    if (!booking) {
      return res.status(404).json({ message: `Booking id=${id} not found` });
    }
    // authorization
    if (
      req.user.role === 'ADMIN' ||
      (req.user.role === 'STUDENT' && booking.studentId === req.user.id) ||
      (req.user.role === 'TEACHER' && booking.course.teacherId === req.user.id)
    ) {
      return res.json(booking);
    }
    return res.status(403).json({ message: 'Forbidden' });
  } catch (err) {
    console.error('getBookingById:', err);
    return res.status(500).json({ message: 'Server error fetching booking' });
  }
};

/**
 * POST /api/bookings
 * STUDENT only
 * Body: { courseId, bookingDate }
 */

export const createBooking = async (req, res, next) => {
  const { courseId, address, sessionDates, paymentMethod, installments } = req.body;
  if (!sessionDates || !address || !courseId) {
    return next(new AppError('Missing required fields', 400));
  }

  try {
    // 1) fetch the course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { price: true, numberOfSessions: true }
    });
    if (!course) {
      return next(new AppError(`Course ${courseId} not found`, 404));
    }

    // 2) validate session count
    if (sessionDates.length !== course.numberOfSessions) {
      return next(new AppError(
        `You must pick exactly ${course.numberOfSessions} session dates`,
        400
      ));
    }

    // 3) compute payment amount
    let amount = course.price;
    if (paymentMethod === 'INSTALLMENT') {
      amount = parseFloat((course.price / installments).toFixed(2));
    }

    // 4) build your nested create data
    //    only add `method` and `installments` if INSTALLMENT
    const paymentData = { amount };
    if (paymentMethod === 'INSTALLMENT') {
      paymentData.method       = 'INSTALLMENT';
      paymentData.installments = installments;
    }
    //  (no need to add method/installments for full, Prisma will default)

    const booking = await prisma.booking.create({
      data: {
        courseId,
        studentId: req.user.id,
        address,
        sessions: {
          create: sessionDates.map(d => ({ sessionDate: new Date(d) }))
        },
        payment: {
          create: paymentData
        }
      },
      include: {
        sessions: true,
        payment:  true
      }
    });

    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/bookings/:id
 * STUDENT or ADMIN (e.g. to cancel)
 * Body: { status }
 */
export const updateBooking = async (req, res) => {
  // const { id } = req.params.id;
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ message: 'status is required' });
  }
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) {
      return res.status(404).json({ message: `Booking id=${id} not found` });
    }
    if (req.user.role === 'STUDENT' && booking.studentId !== req.user.id) {
      return res.status(403).json({ message: 'Cannot modify someone else’s booking' });
    }
    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { bookingStatus: status }
    });
    return res.json(updated);
  } catch (err) {
    console.error('updateBooking:', err);
    return res.status(500).json({ message: 'Server error updating booking' });
  }
};

/**
 * DELETE /api/bookings/:id
 * STUDENT or ADMIN 
 */
export const deleteBooking = async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return res.status(404).json({ message: `Booking id=${id} not found` });
    }
    if (req.user.role === 'STUDENT' && booking.studentId !== req.user.id) {
      return res.status(403).json({ message: 'Cannot delete someone else’s booking' });
    }
    await prisma.booking.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    console.error('deleteBooking:', err);
    return res.status(500).json({ message: 'Server error deleting booking' });
  }
};
