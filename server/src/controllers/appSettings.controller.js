import * as appSettingsService from '../services/appSettings.service.js';
import asyncHandler from 'express-async-handler';

/**
 * Controller untuk mengambil semua pengaturan aplikasi.
 * GET /api/admin/settings
 */
export const getAllSettings = asyncHandler(async (req, res) => {
  const settings = await appSettingsService.getAllSettingsService();
  res.status(200).json(settings);
});

/**
 * Controller untuk memperbarui pengaturan aplikasi.
 * PUT /api/admin/settings
 */
export const updateSettings = asyncHandler(async (req, res) => {
  // req.body diasumsikan berupa array dari objek pengaturan
  await appSettingsService.updateSettingsService(req.body);
  res.status(200).json({ message: 'Settings updated successfully.' });
});