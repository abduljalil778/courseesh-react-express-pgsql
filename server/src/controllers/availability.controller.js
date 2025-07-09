import * as availabilityService from '../services/availability.service.js';
import asyncHandler from 'express-async-handler';

/**
 * Controller untuk mengambil jadwal tidak tersedia milik guru yang login.
 * GET /api/availability
 */
export const getMyUnavailableDates = asyncHandler(async (req, res) => {
  const unavailableSlots = await availabilityService.getMyUnavailableDatesService(req.user);
  res.status(200).json({ data: unavailableSlots });
});

/**
 * Controller untuk guru menambahkan slot waktu tidak tersedia.
 * POST /api/availability/slots
 */
export const addUnavailableSlots = asyncHandler(async (req, res) => {
  const { dates } = req.body;
  await availabilityService.addUnavailableSlotsService(dates, req.user);
  res.status(201).json({ message: 'Unavailable slots added successfully.' });
});

/**
 * Controller untuk guru menghapus jadwal tidak tersedia.
 * DELETE /api/availability/:id
 */
export const removeUnavailableDate = asyncHandler(async (req, res) => {
  await availabilityService.removeUnavailableDateService(req.params.id, req.user);
  res.status(200).json({ message: 'Deleted' });
});

/**
 * Controller untuk mengambil jadwal tidak tersedia dari seorang guru berdasarkan ID.
 * GET /api/availability/schedule/:id
 */
export const getTeacherSchedule = asyncHandler(async (req, res) => {
  const unavailableSlots = await availabilityService.getTeacherScheduleService(req.params.id);
  res.status(200).json({ data: unavailableSlots });
});