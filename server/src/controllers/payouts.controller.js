import * as payoutService from '../services/payout.service.js';
import asyncHandler from 'express-async-handler';

/**
 * Controller untuk mengambil semua data payout guru (Admin/Finance).
 * GET /api/teacher-payouts
 */
export const getAllTeacherPayouts = asyncHandler(async (req, res) => {
  const result = await payoutService.getAllTeacherPayoutsService(req.query);
  res.status(200).json(result);
});

/**
 * Controller untuk mengambil data payout tunggal berdasarkan ID (Admin/Finance).
 * GET /api/teacher-payouts/:payoutId
 */
export const getTeacherPayoutById = asyncHandler(async (req, res) => {
  const payout = await payoutService.getTeacherPayoutByIdService(req.params.payoutId);
  res.status(200).json(payout);
});

/**
 * Controller untuk memperbarui data payout guru (Admin/Finance).
 * PUT /api/teacher-payouts/:payoutId
 */
export const updateTeacherPayout = asyncHandler(async (req, res) => {
  const { payoutId } = req.params;
  const payoutData = req.body;
  const file = req.file;

  const updatedPayout = await payoutService.updateTeacherPayoutService(payoutId, payoutData, file);
  res.status(200).json(updatedPayout);
});