// server/controllers/appSettingsController.js
import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError.mjs';

const prisma = new PrismaClient();

// GET /api/admin/settings
export const getAllSettings = async (req, res, next) => {
  try {
    const settings = await prisma.applicationSetting.findMany({
      orderBy: { key: 'asc' },
    });
    res.json(settings);
  } catch (err) {
    next(new AppError('Failed to retrieve settings', 500));
  }
};

// PUT /api/admin/settings
export const updateSettings = async (req, res, next) => {
  const settingsToUpdate = req.body; // Expects an array of { key, value }

  try {
    const updatePromises = settingsToUpdate.map(setting =>
      prisma.applicationSetting.update({
        where: { key: setting.key },
        data: { value: setting.value },
      })
    );

    await prisma.$transaction(updatePromises);

    res.json({ message: 'Settings updated successfully.' });
  } catch (err) {
    next(new AppError('Failed to update settings', 500));
  }
};