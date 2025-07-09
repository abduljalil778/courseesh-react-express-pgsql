import * as teachersService from '../services/teachers.service.js';
import * as usersService from '../services/users.service.js';
import asyncHandler from 'express-async-handler';

/**
 * Controller untuk guru mengambil semua data payout miliknya.
 * GET /api/teachers/my-payouts
 */
export const getMyPayouts = asyncHandler(async (req, res) => {
  const payouts = await teachersService.getMyPayoutsService(req.user.id);
  res.status(200).json(payouts);
});

/**
 * Controller untuk mengambil profil publik seorang guru.
 * GET /api/teachers/:teacherId/profile
 */
export const getTeacherPublicProfile = asyncHandler(async (req, res) => {
    const publicProfile = await usersService.getTeacherPublicProfileService(req.params.teacherId);
    res.status(200).json({ data: publicProfile });
});