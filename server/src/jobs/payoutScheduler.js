// server/src/jobs/payoutScheduler.js
import cron from 'node-cron';
import prisma from '../../libs/prisma.js';
import { subMonths, endOfMonth, startOfMonth, subWeeks, endOfWeek, startOfWeek } from 'date-fns';
import { formatCurrencyIDR } from '../utils/formatCurrency.js';

export const calculateTeacherPayouts = async () => {
  console.log(`[Scheduler] Running monthly payout calculation job at ${new Date().toISOString()}`);

  const today = new Date();
  const periodStartDate = startOfWeek(subWeeks(today, 1)); // Awal minggu lalu
  const periodEndDate = endOfWeek(subWeeks(today, 1));   // Akhir minggu lalu

  console.log(`[Scheduler] Calculating payouts for period: ${periodStartDate.toISOString()} to ${periodEndDate.toISOString()}`);

  const completedSessions = await prisma.bookingSession.findMany({
    where: {
      status: 'COMPLETED',
      payoutId: null, // Hanya proses yang belum pernah masuk payout
      sessionCompletedAt: {
        gte: periodStartDate,
        lte: periodEndDate,
      },
    },
    include: {
      booking: { include: { course: { select: { teacherId: true, price: true } } } },
    },
  });

  if (completedSessions.length === 0) {
    console.log('[Scheduler] No new completed sessions to process.');
    return;
  }

  const sessionsByTeacher = completedSessions.reduce((acc, session) => {
    const teacherId = session.booking.course.teacherId;
    if (!acc[teacherId]) acc[teacherId] = [];
    acc[teacherId].push(session);
    return acc;
  }, {});

  const feeSetting = await prisma.applicationSetting.findUnique({ where: { key: 'DEFAULT_SERVICE_FEE_PERCENTAGE' }});
  const serviceFeePercentage = parseFloat(feeSetting?.value || '0');

  for (const teacherId in sessionsByTeacher) {
    const teacherSessions = sessionsByTeacher[teacherId];
    let totalHonorarium = 0;
    const sessionIds = teacherSessions.map(session => {
        const pricePerSession = session.booking.course.price;
        totalHonorarium += pricePerSession * (1 - serviceFeePercentage);
        return session.id;
    });

    if (totalHonorarium > 0) {
      await prisma.$transaction(async (tx) => {
        const newPayout = await tx.teacherPayout.create({
          data: {
            teacherId: teacherId,
            periodStartDate,
            periodEndDate,
            totalSessions: teacherSessions.length,
            honorariumAmount: totalHonorarium,
            status: 'PENDING_PAYMENT',
            serviceFeePercentage: serviceFeePercentage,
          },
        });

        await tx.bookingSession.updateMany({
          where: { id: { in: sessionIds } },
          data: { payoutId: newPayout.id },
        });
        console.log(`[Scheduler] Created payout ${newPayout.id} for teacher ${teacherId} with amount ${formatCurrencyIDR(totalHonorarium)}`);
      });
    }
  }
  console.log('[Scheduler] Payout calculation job finished.');
};

export const initPayoutScheduler = () => {
    // '59 23 * * 6' artinya: jam 23:59 setiap hari sabtu.
    cron.schedule('00 00 * * 7', calculateTeacherPayouts, {
        scheduled: true,
        timezone: "Asia/Jakarta"
    });
};