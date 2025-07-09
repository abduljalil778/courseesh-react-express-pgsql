import * as reviewsService from '../services/reviews.service.js';
import asyncHandler from 'express-async-handler';

/**
 * Controller untuk siswa membuat ulasan baru.
 * POST /api/bookings/:id/review
 */
export const createCourseReview = asyncHandler(async (req, res) => {
  const { id: bookingId } = req.params;
  const reviewData = req.body;
  const user = req.user;

  const newReview = await reviewsService.createCourseReviewService(bookingId, reviewData, user);
  res.status(201).json(newReview);
});

/**
 * Controller untuk siswa mengambil ulasan yang pernah ia submit.
 * GET /api/bookings/:id/review
 */
export const getMyReviewForBooking = asyncHandler(async (req, res) => {
    const { id: bookingId } = req.params;
    const review = await reviewsService.getMyReviewForBookingService(bookingId, req.user);
    res.status(200).json(review);
});


/**
 * Controller untuk mengambil semua ulasan untuk sebuah kursus.
 * GET /api/courses/:id/reviews
 */
export const getCourseReviews = asyncHandler(async (req, res) => {
  const { id: courseId } = req.params;
  const reviews = await reviewsService.getCourseReviewsService(courseId);
  res.status(200).json({ data: reviews });
});

/**
 * Controller untuk mengambil semua ulasan untuk seorang guru.
 */
export const getReviewsByTeacher = asyncHandler(async (req, res) => {
    const { id: teacherId } = req.params;
    const reviews = await reviewsService.getReviewsByTeacherService(teacherId);
    res.status(200).json(reviews);
});

/**
 * Controller untuk siswa memperbarui ulasannya.
 */
export const updateReview = asyncHandler(async (req, res) => {
    const { id: bookingId } = req.params;
    const updatedReview = await reviewsService.updateReviewService(bookingId, req.body, req.user);
    res.status(200).json(updatedReview);
});

/**
 * Controller untuk siswa menghapus ulasannya.
 */
export const deleteReview = asyncHandler(async (req, res) => {
    const { id: bookingId } = req.params;
    await reviewsService.deleteReviewService(bookingId, req.user);
    res.status(204).send();
});