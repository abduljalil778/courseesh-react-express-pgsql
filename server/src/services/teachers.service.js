import prisma from '../../libs/prisma.js';
import { BookingStatus } from '@prisma/client';
import { subDays } from 'date-fns';
import AppError from '../utils/AppError.mjs';

/**
 * Service untuk mengambil data statistik untuk dashboard guru.
 * @param {string} teacherId - ID dari guru yang login.
 * @returns {Promise<object>}
 */
export async function getTeacherDashboardStatsService(teacherId) {
  try {
    // 1. KPI Cards (Key Performance Indicators)
    const totalRevenuePromise = prisma.teacherPayout.aggregate({
      _sum: { honorariumAmount: true },
      where: { teacherId: teacherId, status: 'PAID' },
    });

    const totalCoursesPromise = prisma.course.count({
      where: { teacherId: teacherId },
    });

    const uniqueStudentsPromise = prisma.booking.findMany({
      where: {
        course: { teacherId: teacherId },
        bookingStatus: { in: ['CONFIRMED', 'COMPLETED'] },
      },
      distinct: ['studentId'],
      select: { studentId: true },
    });

    const activeBookingsPromise = prisma.booking.count({
      where: {
        course: { teacherId: teacherId },
        bookingStatus: 'CONFIRMED',
      },
    });

    // ++ 2. DATA BARU UNTUK CHART ++
    const thirtyDaysAgo = subDays(new Date(), 30);
    const bookingsOverTimePromise = prisma.booking.groupBy({
        by: ['createdAt'],
        where: { 
            course: { teacherId: teacherId },
            createdAt: { gte: thirtyDaysAgo } 
        },
        _count: { id: true },
        orderBy: { createdAt: 'asc' }
    });

    const [
      totalRevenue, totalCourses, uniqueStudents, activeBookings, rawBookingsData
    ] = await Promise.all([
      totalRevenuePromise,
      totalCoursesPromise,
      uniqueStudentsPromise,
      activeBookingsPromise,
      bookingsOverTimePromise, // Jalankan query baru
    ]);

    // ++ 3. PROSES DATA CHART ++
    const bookingsByDay = rawBookingsData.reduce((acc, booking) => {
        const date = booking.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + booking._count.id;
        return acc;
    }, {});
    const bookingStats = Object.keys(bookingsByDay).map(date => ({
        date: date,
        Bookings: bookingsByDay[date]
    }));

    return {
      kpi: {
        totalRevenue: totalRevenue._sum.honorariumAmount || 0,
        totalCourses: totalCourses,
        totalStudents: uniqueStudents.length,
        activeBookings: activeBookings,
      },
      bookingStats: bookingStats, // Kembalikan data chart
    };
  } catch (err) {
      throw new AppError(err.message || 'Failed to fetch teacher statistics', 500);
  }
}