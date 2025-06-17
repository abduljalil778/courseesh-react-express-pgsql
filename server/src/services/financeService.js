import prisma from '../../libs/prisma.js';
import AppError from '../utils/AppError.mjs';
import { subDays } from 'date-fns';

export const getFinanceRecap = async (req, res, next) => {
  try {
    const now = new Date();
    const ranges = {
      weekly: subDays(now, 7),
      monthly: subDays(now, 30),
      yearly: subDays(now, 365),
    };

    const result = {};
    for (const [key, startDate] of Object.entries(ranges)) {
      const incomeAgg = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID', createdAt: { gte: startDate } },
      });

      const expenseAgg = await prisma.teacherPayout.aggregate({
        _sum: { honorariumAmount: true },
        where: { status: 'PAID', createdAt: { gte: startDate } },
      });

      result[key] = {
        income: incomeAgg._sum.amount || 0,
        expense: expenseAgg._sum.honorariumAmount || 0,
      };
    }

    res.json(result);
  } catch (err) {
    next(new AppError(err.message || 'Failed to fetch finance recap', 500));
  }
};