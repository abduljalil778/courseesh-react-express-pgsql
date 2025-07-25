// server/src/services/honorarium.service.js

import prisma from '../../libs/prisma.js';
import AppError from '../utils/AppError.mjs';
import { PayoutStatus } from '@prisma/client';

/**
 * Service untuk mengkalkulasi honorarium yang belum dibayar berdasarkan rentang tanggal.
 * @param {Date} startDate - Tanggal mulai periode.
 * @param {Date} endDate - Tanggal akhir periode.
 * @returns {Promise<Array>}
 */
export async function calculatePendingHonorariumService(startDate, endDate) {
  const completedSessions = await prisma.bookingSession.findMany({
    where: {
      status: 'COMPLETED',
      payoutId: null, // Penting: Hanya sesi yang belum pernah dibayarkan
      sessionCompletedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      booking: { include: { course: { select: { teacherId: true, price: true, teacher: { select: { id: true, name: true, email: true } } } } } },
    },
  });

  if (completedSessions.length === 0) {
    return [];
  }

  const feeSetting = await prisma.applicationSetting.findUnique({ where: { key: 'DEFAULT_SERVICE_FEE_PERCENTAGE' } });
  const serviceFeePercentage = parseFloat(feeSetting?.value || '0.15');

  const honorariumByTeacher = completedSessions.reduce((acc, session) => {
    const teacher = session.booking.course.teacher;
    if (!acc[teacher.id]) {
      acc[teacher.id] = {
        teacherId: teacher.id,
        teacherName: teacher.name,
        teacherEmail: teacher.email,
        totalSessions: 0,
        totalHonorarium: 0,
        sessionIds: [],
      };
    }

    const pricePerSession = session.booking.course.price;
    acc[teacher.id].totalSessions += 1;
    acc[teacher.id].totalHonorarium += pricePerSession * (1 - serviceFeePercentage);
    acc[teacher.id].sessionIds.push(session.id);

    return acc;
  }, {});

  return Object.values(honorariumByTeacher);
}

/**
 * Service untuk memproses dan membuat record TeacherPayout berdasarkan data honorarium.
 * @param {Array} payoutsToProcess - Data honorarium yang akan diproses.
 * @returns {Promise<number>} Jumlah payout yang berhasil dibuat.
 */
export async function processHonorariumPayoutsService(payoutsToProcess) {
  const feeSetting = await prisma.applicationSetting.findUnique({ where: { key: 'DEFAULT_SERVICE_FEE_PERCENTAGE' }});
  const serviceFeePercentage = parseFloat(feeSetting?.value || '0.15');

  return await prisma.$transaction(async (tx) => {
    let createdCount = 0;
    for (const payoutData of payoutsToProcess) {
      const { teacherId, totalSessions, totalHonorarium, sessionIds, periodStartDate, periodEndDate } = payoutData;
      
      const newPayout = await tx.teacherPayout.create({
        data: {
          teacherId,
          periodStartDate,
          periodEndDate,
          totalSessions,
          honorariumAmount: totalHonorarium,
          serviceFeePercentage,
          status: 'PENDING_PAYMENT',
        },
      });

      await tx.bookingSession.updateMany({
        where: { id: { in: sessionIds } },
        data: { payoutId: newPayout.id },
      });
      createdCount++;
    }
    return createdCount;
  });
}