import prisma from '../../libs/prisma.js';

/**
 * GET /api/notifications
 */
export const getMyNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 15 } = req.query;
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;

    const where = { recipientId: req.user.id };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitInt,
      }),
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
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    const { type } = req.query; 

        const whereClause = {
            recipientId: req.user.id,
            isRead: false,
        };

        // Jika ada tipe spesifik, tambahkan ke filter
        if (type === 'GENERAL') {
            whereClause.type = { not: 'NEW_MESSAGE' };
        } else if (type === 'NEW_MESSAGE') {
            whereClause.type = 'NEW_MESSAGE';
        }

        await prisma.notification.updateMany({
            where: whereClause,
            data: { isRead: true },
        });

        res.status(204).send();
    } catch (err) {
        next(new AppError(err.message, 500));
    }
};