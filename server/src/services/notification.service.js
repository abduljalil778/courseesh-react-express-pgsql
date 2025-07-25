import prisma from '../../libs/prisma.js';
import AppError from '../utils/AppError.mjs';

/**
 * Service untuk mengambil notifikasi milik user yang sedang login.
 * @param {string} userId - ID dari user yang sedang login.
 * @param {object} query - Opsi query seperti { page, limit }.
 * @returns {Promise<{data: Array, total: number, page: number, totalPages: number}>}
 */
export async function getMyNotificationsService(userId, query = {}) {
  const { page = 1, limit = 15 } = query;
  const pageInt = parseInt(page);
  const limitInt = parseInt(limit);
  const skip = (pageInt - 1) * limitInt;

  const where = { recipientId: userId };

  try {
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitInt,
      }),
      prisma.notification.count({ where }),
    ]);
    
    return { 
      data: notifications,
      total,
      page: pageInt,
      totalPages: Math.ceil(total / limitInt)
    };
  } catch (err) {
    throw new AppError(err.message, 500);
  }
};

/**
 * Service untuk menandai semua notifikasi sebagai telah dibaca.
 * @param {string} userId - ID dari user yang sedang login.
 * @param {string} type - Tipe notifikasi yang akan ditandai ('GENERAL' atau 'NEW_MESSAGE').
 */
export async function markAllAsReadService(userId, type) {
    const whereClause = {
        recipientId: userId,
        isRead: false,
    };

    if (type === 'GENERAL') {
        whereClause.type = { not: 'NEW_MESSAGE' };
    } else if (type === 'NEW_MESSAGE') {
        whereClause.type = 'NEW_MESSAGE';
    }

    try {
        await prisma.notification.updateMany({
            where: whereClause,
            data: { isRead: true },
        });
    } catch (err) {
        throw new AppError(err.message, 500);
    }
};