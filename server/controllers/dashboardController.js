import { Prisma, Role, BookingStatus } from '@prisma/client';
import prisma from '../libs/prisma.js';
import AppError from '../utils/AppError.mjs';
import { subDays } from 'date-fns';

/**
 * GET /api/admin/stats
 * Mengambil semua data agregat untuk dashboard admin.
 */
export const getDashboardStats = async (req, res, next) => {
  try {

    // 1. KPI Cards (Key Performance Indicators)
    const totalUsersPromise = prisma.user.count();
    const totalTeachersPromise = prisma.user.count({ where: { role: Role.TEACHER } });
    const totalStudentsPromise = prisma.user.count({ where: { role: Role.STUDENT } });
    const totalCoursesPromise = prisma.course.count();
    const activeBookingsPromise = prisma.booking.count({ where: { bookingStatus: BookingStatus.CONFIRMED }});
    const totalRevenuePromise = prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' }
    });
    
    // 2. Data Grafik Booking (30 hari terakhir)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const bookingsOverTimePromise = prisma.booking.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true },
        orderBy: { createdAt: 'asc' }
    });

    // 3. Data Grafik Popularitas Kursus (Top 5)
    const coursePopularityPromise = prisma.booking.groupBy({
        by: ['courseId'],
        _count: { id: true },
    });

    // 4. Data untuk Ranking Revenue per Teacher
    // Ambil semua pembayaran lunas dan sertakan detail guru terkait
    const paidPaymentsForRankingPromise = prisma.payment.findMany({
        where: { status: 'PAID' },
        include: {
            booking: {
                select: {
                    course: {
                        select: {
                            teacher: {
                                select: { id: true, name: true }
                            }
                        }
                    }
                }
            }
        }
    });

    // --- Jalankan semua query secara paralel ---
    const [
        usersCount, teachersCount, studentsCount, coursesCount,
        activeBookingsCount, revenueResult,
        rawBookingsData, rawCourseData,
        paidPaymentsForRanking // <-- Hasil dari query baru
    ] = await prisma.$transaction([
        totalUsersPromise, totalTeachersPromise, totalStudentsPromise, totalCoursesPromise,
        activeBookingsPromise, totalRevenuePromise,
        bookingsOverTimePromise, coursePopularityPromise,
        paidPaymentsForRankingPromise // <-- Jalankan query baru
    ]);

    // --- Format data untuk chart popularitas kursus ---
    const courseIds = rawCourseData.map(item => item.courseId);
    const coursesInfo = await prisma.course.findMany({
        where: { id: { in: courseIds } },
        select: { id: true, category: true }
    });
    const categoryMap = {};
    rawCourseData.forEach(item => {
        const course = coursesInfo.find(c => c.id === item.courseId);
        const cat = course?.category || 'UNKNOWN';
        categoryMap[cat] = (categoryMap[cat] || 0) + item._count.id;
    });
    const coursePopularityStats = Object.entries(categoryMap)
        .map(([category, count]) => ({ name: category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    
    

    // --- Format data untuk chart booking per hari ---
    const bookingsByDay = rawBookingsData.reduce((acc, booking) => {
        const date = booking.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
            acc[date] = 0;
        }
        acc[date] += booking._count.id;
        return acc;
    }, {});
    const bookingStats = Object.keys(bookingsByDay).map(date => ({
        date: date,
        Bookings: bookingsByDay[date]
    }));

    // --- Proses data ranking revenue per teacher ---
    const teacherRevenueMap = new Map();
    paidPaymentsForRanking.forEach(payment => {
        const teacher = payment.booking?.course?.teacher;
        if (teacher) {
            const currentRevenue = teacherRevenueMap.get(teacher.id) || { name: teacher.name, revenue: 0 };
            teacherRevenueMap.set(teacher.id, {
                ...currentRevenue,
                revenue: currentRevenue.revenue + (payment.amount || 0)
            });
        }
    });
    const teacherRevenueRanking = Array.from(teacherRevenueMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5); // Ambil top 5

    // --- Gabungkan semua hasil ---
    const stats = {
      kpi: {
        totalUsers: usersCount,
        totalTeachers: teachersCount,
        totalStudents: studentsCount,
        totalCourses: coursesCount,
        activeBookings: activeBookingsCount,
        totalRevenue: revenueResult._sum.amount || 0,
      },
      bookingStats,
      coursePopularityStats,
      teacherRevenueRanking, // Tambahkan data yang sudah diproses
    };

    res.json(stats);
  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    next(new AppError('Failed to load dashboard statistics.', 500));
  }
};