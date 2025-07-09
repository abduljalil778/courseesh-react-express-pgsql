import prisma from '../../libs/prisma.js';
import AppError from '../utils/AppError.mjs';

/**
 * Service untuk mengambil semua pengaturan aplikasi.
 * @returns {Promise<Array>}
 */
export async function getAllSettingsService() {
  try {
    return await prisma.applicationSetting.findMany({
      orderBy: { key: 'asc' },
    });
  } catch (err) {
    throw new AppError('Failed to retrieve settings', 500);
  }
};

/**
 * Service untuk memperbarui pengaturan aplikasi.
 * @param {Array<{key: string, value: string}>} settingsToUpdate - Array dari objek pengaturan.
 * @returns {Promise<void>}
 */
export async function updateSettingsService(settingsToUpdate) {
  if (!Array.isArray(settingsToUpdate) || settingsToUpdate.length === 0) {
    throw new AppError('No settings provided for update.', 400);
  }

  try {
    // Gunakan transaksi untuk memastikan semua pembaruan berhasil atau tidak sama sekali
    const updatePromises = settingsToUpdate.map(setting =>
      prisma.applicationSetting.update({
        where: { key: setting.key },
        data: { value: setting.value },
      })
    );

    await prisma.$transaction(updatePromises);
  } catch (err) {
    // Menangkap error jika salah satu kunci (key) tidak ditemukan
    if (err.code === 'P2025') {
       throw new AppError('One or more setting keys were not found.', 404);
    }
    throw new AppError('Failed to update settings', 500);
  }
};