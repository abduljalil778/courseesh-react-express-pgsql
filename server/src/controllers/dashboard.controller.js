import * as dashboardService from '../services/dashboard.service.js';
import asyncHandler from 'express-async-handler';

/**
 * Controller untuk mengambil semua statistik dashboard admin.
 * GET /api/admin/dashboard/stats
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getDashboardStatsService();
  res.status(200).json(stats);
});