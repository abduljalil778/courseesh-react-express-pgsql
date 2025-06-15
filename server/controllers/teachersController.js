// server/controllers/teachersController.js
import {Prisma, PrismaClient, PayoutStatus} from '@prisma/client'
const prisma = new PrismaClient()
import AppError from '../utils/AppError.mjs';

// GET /api/my-payouts
export const getMyPayouts = async (req, res, next) => {
  try {
    const loggedInTeacherId = req.user.id;
    const payouts = await prisma.teacherPayout.findMany({
      where: { teacherId: loggedInTeacherId },
      include: {
        booking: {
          select: {
            id: true,
            course: { select: { title: true, imageUrl: true,} },
            student: { select: { name: true } },
            courseCompletionDate: true,
            createdAt: true,
            sessions: {
              select: {
                id: true,
                sessionDate: true,
                status: true,
              },
              orderBy: { sessionDate: 'asc' },
            }
          },
        },
        bookingSession: {
          select: {
            id: true,
            sessionDate: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(payouts);
  } catch (err) {
    next(new AppError(err.message || 'Failed to fetch payouts', 500));
  }
};

