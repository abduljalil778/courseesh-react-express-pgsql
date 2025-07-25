import * as honorariumService from '../services/honorarium.service.js';
import asyncHandler from 'express-async-handler';
import AppError from '../utils/AppError.mjs';

export const getPendingHonorariums = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    throw new AppError('Start date and end date are required.', 400);
  }
  const results = await honorariumService.calculatePendingHonorariumService(new Date(startDate), new Date(endDate));
  res.status(200).json({ data: results });
});

export const processPayouts = asyncHandler(async (req, res) => {
    const { payouts, periodStartDate, periodEndDate } = req.body;
    if (!payouts || !Array.isArray(payouts) || payouts.length === 0) {
        throw new AppError('Payouts data is required and must be a non-empty array.', 400);
    }

    const payoutsWithPeriod = payouts.map(p => ({...p, periodStartDate, periodEndDate}));
    const count = await honorariumService.processHonorariumPayoutsService(payoutsWithPeriod);
    res.status(201).json({ message: `${count} payout records successfully created.` });
});