import * as financeService from '../services/finance.service.js';
import * as dashboardService from '../services/dashboard.service.js';
import asyncHandler from 'express-async-handler';

/**
 * Controller untuk mengambil rekapitulasi keuangan.
 * GET /api/finance/recap
 */
export const getFinanceRecap = asyncHandler(async (req, res) => {
  const recap = await financeService.getFinanceRecapService();
  res.status(200).json(recap);
});

/**
 * Controller untuk mengambil statistik dashboard (digunakan bersama oleh Admin dan Finance).
 * GET /api/finance/stats
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getDashboardStatsService();
  res.status(200).json(stats);
});