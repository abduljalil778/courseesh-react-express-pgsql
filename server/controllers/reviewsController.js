// server/controllers/reviewsController.js
import pkg from '@prisma/client';
const { PrismaClient, Prisma, BookingStatus } = pkg;
const prisma = new PrismaClient();
import AppError from '../utils/AppError.mjs';

/**
 * POST /api/bookings/:bookingId/review
 * Siswa membuat review untuk booking yang sudah selesai.
 */
export const createCourseReview = async (req, res, next) => {
  const { id: bookingId } = req.params;
  const { rating, comment } = req.body;
  const studentId = req.user.id;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        course: { // Perlu courseId dan teacherId dari kursus
          select: { id: true, teacherId: true }
        },
        review: true // Untuk cek apakah sudah ada review
      }
    });

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    if (booking.studentId !== studentId) {
      return next(new AppError('You are not authorized to review this booking', 403));
    }

    if (booking.bookingStatus !== BookingStatus.COMPLETED) {
      return next(new AppError('Course must be completed before it can be reviewed', 400));
    }

    if (booking.review) {
      return next(new AppError('You have already reviewed this course booking', 400));
    }

    const newReview = await prisma.courseReview.create({
      data: {
        bookingId,
        studentId,
        courseId: booking.course.id,
        teacherId: booking.course.teacherId, // Teacher dari kursus yang dibooking
        rating: Number(rating),
        comment: comment || null,
      },
      // Anda bisa include relasi jika ingin mengembalikan data yang lebih lengkap
      // include: { student: {select:{name:true}}, course: {select:{title:true}} }
    });

    res.status(201).json(newReview);
  } catch (err) {
    console.error(`Error creating review for booking ID ${bookingId}:`, err);
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') { // Jika bookingId di CourseReview unique constraint fail
        return next(new AppError('Review for this booking already exists (P2002).', 409));
    }
    next(new AppError(err.message || 'Failed to create review', 500));
  }
};

/**
 * GET /api/bookings/:bookingId/review
 * Siswa mengambil review yang pernah dia submit untuk suatu booking.
 */
export const getMyReviewForBooking = async (req, res, next) => {
    const { id: bookingId } = req.params;
    const studentId = req.user.id;

    try {
        const review = await prisma.courseReview.findUnique({
            where: { bookingId },
        });

        if (!review) {
            return next(new AppError('No review found for this booking.', 404));
        }

        // Pastikan siswa yang meminta adalah siswa yang membuat review
        if (review.studentId !== studentId) {
            return next(new AppError('You are not authorized to view this review.', 403));
        }
        
        res.json(review);
    } catch (err) {
        next(new AppError(err.message || "Could not fetch review.", 500));
    }
};


/**
 * GET /api/courses/:courseId/reviews
 * Mendapatkan semua review untuk sebuah course (bisa untuk publik atau student).
 */
export const getReviewsForCourse = async (req, res, next) => {
  const { id: courseId } = req.params;
  try {
    const reviews = await prisma.courseReview.findMany({
      where: { courseId },
      include: {
        student: { // Hanya ambil nama siswa untuk ditampilkan, jangan email atau data sensitif lain
          select: { name: true, id: true } 
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(reviews);
  } catch (err) {
    next(new AppError(err.message || 'Could not fetch reviews for course.', 500));
  }
};

export const getReviewsByTeacher = async (req, res, next) => {
  const { id: teacherId } = req.params;
  try {
    const reviews = await prisma.courseReview.findMany({
      where: { teacherId },
      include: {
        course: {
          select: { title: true, id: true }
        },
        student: {
          select: { name: true, id: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(reviews);
  } catch (err) {
    next(new AppError(err.message || 'Could not fetch reviews for teacher.', 500));
  }
};

export const updateReview = async (req, res, next) => {
  const { id: bookingId } = req.params;
  const { rating, comment } = req.body;
  const studentId = req.user.id;

  try {
    const review = await prisma.courseReview.findUnique({
      where: { bookingId }
    });

    if (!review) {
      return next(new AppError('Review not found for this booking.', 404));
    }

    if (review.studentId !== studentId) {
      return next(new AppError('You are not authorized to update this review.', 403));
    }

    const updatedReview = await prisma.courseReview.update({
      where: { bookingId },
      data: {
        rating: Number(rating),
        comment: comment || null
      }
    });

    res.json(updatedReview);
  } catch (err) {
    next(new AppError(err.message || 'Failed to update review', 500));
  }
};

export const deleteReview = async (req, res, next) => {
  const { id: bookingId } = req.params;
  const studentId = req.user.id;

  try {
    const review = await prisma.courseReview.findUnique({
      where: { bookingId }
    });

    if (!review) {
      return next(new AppError('Review not found for this booking.', 404));
    }

    if (review.studentId !== studentId) {
      return next(new AppError('You are not authorized to delete this review.', 403));
    }

    await prisma.courseReview.delete({
      where: { bookingId }
    });

    res.status(204).send(); // No content
  } catch (err) {
    next(new AppError(err.message || 'Failed to delete review', 500));
  }
}

// Tambahkan fungsi lain jika perlu, misal update/delete review oleh siswa,
// atau get reviews by teacher