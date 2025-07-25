import * as coursesService from '../services/courses.service.js';
import asyncHandler from 'express-async-handler';

/**
 * Controller untuk mengambil semua kursus.
 * GET /api/courses
 */
export const getAllCourses = asyncHandler(async (req, res) => {
  // Meneruskan query filter dan user yang login ke service
  const result = await coursesService.getAllCoursesService(req.query, req.user);
  res.status(200).json(result);
});

/**
 * Controller untuk mengambil satu kursus berdasarkan ID.
 * GET /api/courses/:id
 */
export const getCourseById = asyncHandler(async (req, res) => {
  const course = await coursesService.getCourseByIdService(req.params.id);
  res.status(200).json({ data: course });
});

/**
 * Controller untuk membuat kursus baru.
 * POST /api/courses
 */
export const createCourse = asyncHandler(async (req, res) => {
  // Meneruskan body, user, dan file yang diunggah ke service
  const newCourse = await coursesService.createCourseService(req.body, req.user, req.file);
  res.status(201).json(newCourse);
});

/**
 * Controller untuk memperbarui kursus.
 * PUT /api/courses/:id/update
 */
export const updateCourse = asyncHandler(async (req, res) => {
  const updatedCourse = await coursesService.updateCourseService(req.params.id, req.body, req.user, req.file);
  res.status(200).json(updatedCourse);
});

/**
 * Controller untuk menghapus kursus.
 * DELETE /api/courses/:id
 */
export const deleteCourse = asyncHandler(async (req, res) => {
  // Meneruskan id dan user untuk otorisasi di dalam service
  await coursesService.deleteCourseService(req.params.id, req.user);
  res.status(204).send();
});