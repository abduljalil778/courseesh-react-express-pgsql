// server/src/controllers/teachers.controller.js
import * as payoutService from '../services/payout.service.js';
import * as usersService from '../services/users.service.js';
import * as teachersService from '../services/teachers.service.js'
import asyncHandler from 'express-async-handler';

/**
 * Controller untuk guru mengambil semua data payout miliknya.
 * GET /api/teachers/my-payouts
 */
export const getMyPayouts = asyncHandler(async (req, res) => {
  // Panggil service payout utama dengan filter teacherId dari user yang login
  const result = await payoutService.getAllTeacherPayoutsService({ teacherId: req.user.id });
  
  // Halaman frontend 'MyPayouts.jsx' mengharapkan array langsung, 
  // jadi kita kirim result.payouts
  res.status(200).json(result.payouts);
});

/**
 * Controller untuk mengambil profil publik seorang guru.
 * GET /api/teachers/:teacherId/profile
 */
export const getTeacherPublicProfile = asyncHandler(async (req, res) => {
    const publicProfile = await usersService.getTeacherPublicProfileService(req.params.teacherId);
    res.status(200).json({ data: publicProfile });
});

export const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await teachersService.getTeacherDashboardStatsService(req.user.id);
  res.status(200).json({ data: stats });
});