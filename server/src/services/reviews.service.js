import { Prisma, BookingStatus } from '@prisma/client';
import prisma from '../../libs/prisma.js';
import AppError from '../utils/AppError.mjs';

/**
 * Service untuk siswa membuat ulasan baru untuk sebuah booking.
 * @param {string} bookingId - ID dari booking yang akan diulas.
 * @param {object} reviewData - Data ulasan { rating, comment }.
 * @param {object} user - User siswa yang sedang login.
 * @returns {Promise<object>}
 */
export async function createCourseReviewService(bookingId, reviewData, user) {
  const { rating, comment } = reviewData;
  const studentId = user.id;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      course: { select: { id: true, teacherId: true } },
      review: true
    }
  });

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }
  if (booking.studentId !== studentId) {
    throw new AppError('You are not authorized to review this booking', 403);
  }
  if (booking.bookingStatus !== BookingStatus.COMPLETED) {
    throw new AppError('Course must be completed before it can be reviewed', 400);
  }
  if (booking.review) {
    throw new AppError('You have already reviewed this course booking', 400);
  }

  try {
    return await prisma.courseReview.create({
      data: {
        bookingId,
        studentId,
        courseId: booking.course.id,
        teacherId: booking.course.teacherId,
        rating: Number(rating),
        comment: comment || null,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') { 
        throw new AppError('Review for this booking already exists (P2002).', 409);
    }
    throw new AppError(err.message || 'Failed to create review', 500);
  }
};

/**
 * Service untuk mengambil semua ulasan untuk sebuah kursus.
 * @param {string} courseId - ID dari kursus.
 * @returns {Promise<Array>}
 */
export async function getCourseReviewsService(courseId) {
  return await prisma.courseReview.findMany({
    where: { courseId },
    include: {
      student: {
        select: { name: true, id: true, avatarUrl: true } 
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};

/**
 * Service untuk mengambil ulasan yang pernah disubmit oleh siswa untuk booking tertentu.
 * @param {string} bookingId - ID dari booking.
 * @param {object} user - User siswa yang login.
 * @returns {Promise<object>}
 */
export async function getMyReviewForBookingService(bookingId, user) {
    const review = await prisma.courseReview.findUnique({
        where: { bookingId },
    });

    if (!review) {
        throw new AppError('No review found for this booking.', 404);
    }
    if (review.studentId !== user.id) {
        throw new AppError('You are not authorized to view this review.', 403);
    }
    
    return review;
};

/**
 * Service untuk mengambil semua ulasan yang ditujukan untuk seorang guru.
 * @param {string} teacherId - ID dari guru.
 * @returns {Promise<Array>}
 */
export async function getReviewsByTeacherService(teacherId) {
    return await prisma.courseReview.findMany({
      where: { teacherId },
      include: {
        course: { select: { title: true, id: true } },
        student: { select: { name: true, id: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
};

/**
 * Service untuk memperbarui ulasan.
 * @param {string} bookingId - ID booking yang ulasannya akan diperbarui.
 * @param {object} reviewData - Data ulasan baru { rating, comment }.
 * @param {object} user - User siswa yang login.
 * @returns {Promise<object>}
 */
export async function updateReviewService(bookingId, reviewData, user) {
  const { rating, comment } = reviewData;

  const review = await prisma.courseReview.findUnique({ where: { bookingId } });
  if (!review) {
    throw new AppError('Review not found for this booking.', 404);
  }
  if (review.studentId !== user.id) {
    throw new AppError('You are not authorized to update this review.', 403);
  }

  return await prisma.courseReview.update({
    where: { bookingId },
    data: {
      rating: Number(rating),
      comment: comment || null
    }
  });
};

/**
 * Service untuk menghapus ulasan.
 * @param {string} bookingId - ID booking yang ulasannya akan dihapus.
 * @param {object} user - User siswa yang login.
 */
export async function deleteReviewService(bookingId, user) {
  const review = await prisma.courseReview.findUnique({ where: { bookingId } });
  if (!review) {
    throw new AppError('Review not found for this booking.', 404);
  }
  if (review.studentId !== user.id) {
    throw new AppError('You are not authorized to delete this review.', 403);
  }

  await prisma.courseReview.delete({ where: { bookingId } });
};