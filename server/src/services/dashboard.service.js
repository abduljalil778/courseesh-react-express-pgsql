import { Prisma, Role, BookingStatus } from '@prisma/client';
import prisma from '../../libs/prisma.js';
import AppError from '../utils/AppError.mjs';
import { subDays } from 'date-fns';

/**
 * Service untuk mengambil semua data agregat untuk dashboard admin.
 * @returns {Promise<object>} Objek berisi semua statistik untuk dashboard.
 */
export async function getDashboardStatsService() {
  try {
    // 1. Definisi query untuk KPI Cards
    const totalUsersPromise = prisma.user.count();
    const totalTeachersPromise = prisma.user.count({ where: { role: Role.TEACHER } });
    const totalStudentsPromise = prisma.user.count({ where: { role: Role.STUDENT } });
    const totalCoursesPromise = prisma.course.count();
    const activeBookingsPromise = prisma.booking.count({ where: { bookingStatus: BookingStatus.CONFIRMED }});
    const totalRevenuePromise = prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' }
    });
    
    // 2. Query untuk data grafik Booking (30 hari terakhir)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const bookingsOverTimePromise = prisma.booking.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true },
        orderBy: { createdAt: 'asc' }
    });

    // 3. Query untuk data grafik Popularitas Kursus
    const coursePopularityPromise = prisma.booking.groupBy({
        by: ['courseId'],
        _count: { id: true },
    });

    // 4. Query untuk data ranking revenue per guru
    const paidPaymentsForRankingPromise = prisma.payment.findMany({
        where: { status: 'PAID' },
        include: {
            booking: {
                select: {
                    course: {
                        select: {
                            teacher: { select: { id: true, name: true } }
                        }
                    }
                }
            }
        }
    });

    // Jalankan semua query secara paralel menggunakan transaksi
    const [
        usersCount, teachersCount, studentsCount, coursesCount,
        activeBookingsCount, revenueResult,
        rawBookingsData, rawCourseData,
        paidPaymentsForRanking
    ] = await prisma.$transaction([
        totalUsersPromise, totalTeachersPromise, totalStudentsPromise, totalCoursesPromise,
        activeBookingsPromise, totalRevenuePromise,
        bookingsOverTimePromise, coursePopularityPromise,
        paidPaymentsForRankingPromise
    ]);

    //  Format data untuk chart popularitas kursus 
    const courseIds = rawCourseData.map(item => item.courseId);
    
    // Ambil info kursus beserta relasi ke tabel Category
    const coursesInfo = await prisma.course.findMany({
        where: { id: { in: courseIds } },
        include: {
          category: { // Sertakan data dari tabel Category
            select: { name: true } 
          }
        }
    });

    // Agregasi data berdasarkan nama kategori
    const categoryMap = rawCourseData.reduce((acc, item) => {
        const course = coursesInfo.find(c => c.id === item.courseId);
        // Gunakan nama dari relasi: course.category.name
        const categoryName = course?.category?.name || 'Uncategorized';
        acc[categoryName] = (acc[categoryName] || 0) + item._count.id;
        return acc;
    }, {});

    const coursePopularityStats = Object.entries(categoryMap)
        .map(([name, count]) => ({ name, count })) // 
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    
    // Format data untuk chart booking per hari
    const bookingsByDay = rawBookingsData.reduce((acc, booking) => {
        const date = booking.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + booking._count.id;
        return acc;
    }, {});
    const bookingStats = Object.keys(bookingsByDay).map(date => ({
        date: date,
        Bookings: bookingsByDay[date]
    }));

    // Proses data ranking revenue per guru
    const teacherRevenueMap = paidPaymentsForRanking.reduce((acc, payment) => {
        const teacher = payment.booking?.course?.teacher;
        if (teacher) {
            const current = acc.get(teacher.id) || { name: teacher.name, revenue: 0 };
            current.revenue += payment.amount || 0;
            acc.set(teacher.id, current);
        }
        return acc;
    }, new Map());
    const teacherRevenueRanking = Array.from(teacherRevenueMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    // Gabungkan semua hasil menjadi satu objek
    return {
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
      teacherRevenueRanking,
    };

  } catch (err) {
    throw new AppError('Failed to load dashboard statistics.', 500);
  }
};