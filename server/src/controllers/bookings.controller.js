import * as bookingsService from '../services/bookings.service.js';
import asyncHandler from 'express-async-handler';

/**
 * Controller untuk mengambil semua booking.
 * GET /api/bookings
 */
export const getAllBookings = asyncHandler(async (req, res) => {
  const result = await bookingsService.getAllBookingsService({
    user: req.user,
    filters: req.query,
  });
  res.status(200).json(result);
});

/**
 * Controller untuk mengambil booking tunggal berdasarkan ID.
 * GET /api/bookings/:id
 */
export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await bookingsService.getBookingByIdService(req.params.id, req.user);
  res.status(200).json(booking);
});

/**
 * Controller untuk membuat booking baru.
 * POST /api/bookings
 */
export const createBooking = asyncHandler(async (req, res) => {
  const newBooking = await bookingsService.createBookingService(req.body, req.user);
  res.status(201).json(newBooking);
});

/**
 * Controller untuk memperbarui status booking.
 * PUT /api/bookings/:id
 */
export const updateBooking = asyncHandler(async (req, res) => {
  const { bookingStatus } = req.body;
  const updatedBooking = await bookingsService.updateBookingStatusService(req.params.id, bookingStatus, req.user);
  res.status(200).json(updatedBooking);
});

/**
 * Controller untuk menghapus booking.
 * DELETE /api/bookings/:id
 */
export const deleteBooking = asyncHandler(async (req, res) => {
  await bookingsService.deleteBookingService(req.params.id, req.user);
  res.status(204).send();
});

/**
 * Controller untuk guru submit laporan akhir booking.
 * PUT /api/bookings/:id/overall-report
 */
export const submitOverallBookingReport = asyncHandler(async (req, res) => {
  const { overallTeacherReport, finalGrade } = req.body;
  const result = await bookingsService.submitOverallReportService(req.params.id, { overallTeacherReport, finalGrade }, req.user);
  res.status(200).json(result);
});