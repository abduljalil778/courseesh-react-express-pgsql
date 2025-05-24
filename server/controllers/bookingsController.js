// server/controllers/bookingsController.js
import pkg from '@prisma/client';
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
      // where = { course: { teacherId: req.user.id } };
      where = {
        course: {
          is: {teacherId: req.user.id}
        }
      }
    } else if (req.user.role === 'STUDENT') {
      where = { studentId: req.user.id };
    }
    // const bookings = await prisma.booking.findMany({
    //   where,
    //   include: { course: true, student: { select: { email: true } } }
    // });
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
        }
        // …add other relations here if you like…
      }
    });
    res.json(bookings);

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
export const createBooking = async (req, res) => {
  const { courseId, bookingDate } = req.body;
  if (!courseId || !bookingDate) {
    return res.status(400).json({ message: 'courseId and bookingDate are required' });
  }
  try {
    // optional: check course exists
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ message: `Course id=${courseId} not found` });
    }

    const booking = await prisma.booking.create({
      data: {
        courseId,
        studentId: req.user.id,
        bookingDate: new Date(bookingDate)
      }
    });
    return res.status(201).json(booking);
  } catch (err) {
    console.error('createBooking:', err);
    return res.status(500).json({ message: 'Server error creating booking' });
  }
};

/**
 * PUT /api/bookings/:id
 * STUDENT or ADMIN (e.g. to cancel)
 * Body: { status }
 */
export const updateBooking = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ message: 'status is required' });
  }
  try {
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return res.status(404).json({ message: `Booking id=${id} not found` });
    }
    if (req.user.role === 'STUDENT' && booking.studentId !== req.user.id) {
      return res.status(403).json({ message: 'Cannot modify someone else’s booking' });
    }
    const updated = await prisma.booking.update({
      where: { id },
      data: { status }
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
