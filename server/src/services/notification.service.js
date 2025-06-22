import prisma from '../../libs/prisma.js';

/**
 * GET /api/notifications
 * Mengambil semua notifikasi milik user yang login.
 */
export const getMyNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 15 } = req.query; // Ambil query page/limit
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;

    const where = { recipientId: req.user.id };

    // Jalankan dua query secara paralel untuk efisiensi
    const [notifications, total] = await Promise.all([
      // Query 1: Ambil data notifikasi untuk halaman saat ini
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitInt,
      }),
      // Query 2: Hitung total notifikasi untuk pagination
      prisma.notification.count({ where }),
    ]);
    
    res.status(200).json({ 
      data: notifications,
      total,
      page: pageInt,
      totalPages: Math.ceil(total / limitInt)
    });

  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

/**
 * POST /api/notifications/mark-as-read
 * Menandai semua notifikasi yang belum dibaca milik user sebagai sudah dibaca.
 */
export const markAllAsRead = async (req, res, next) => {
    try {
        await prisma.notification.updateMany({
            where: {
                recipientId: req.user.id,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });
        res.status(204).send(); // 204 No Content, artinya sukses tanpa perlu body balasan
    } catch (err) {
        next(new AppError(err.message, 500));
    }
};