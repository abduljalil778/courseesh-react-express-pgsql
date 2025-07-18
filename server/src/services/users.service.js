import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import AppError from '../utils/AppError.mjs';
import prisma from '../../libs/prisma.js';

/**
 * Service untuk mengambil semua user dengan filter dan paginasi.
 * @param {object} filters - Opsi filter seperti { search, role, page, limit }.
 * @returns {Promise<{users: Array, total: number}>}
 */
export async function getAllUsersService(filters = {}) {
  const { search = "", role = "", page = 1, limit = 10 } = filters;
  const pageInt = parseInt(page);
  const limitInt = parseInt(limit);
  const skip = (pageInt - 1) * limitInt;

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }
  if (role) {
    where.role = role;
  }

  const total = await prisma.user.count({ where });
  const users = await prisma.user.findMany({
    where,
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      status: true, avatarUrl: true, createdAt: true,
    },
    orderBy: { name: "asc" },
    skip,
    take: limitInt,
  });

  return { users, total };
}

/**
 * Service untuk mengambil data user tunggal berdasarkan ID (profil publik guru).
 * @param {string} userId - ID dari user.
 * @returns {Promise<object>}
 */
export async function getUserByIdService(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, phone: true, role: true, avatarUrl: true,
      headline: true, bio: true, websiteUrl: true, certifications: true, education: true,
      createdAt: true, updatedAt: true,
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
}


/**
 * Service untuk mengambil profil publik seorang guru beserta kursusnya.
 * @param {string} teacherId - ID dari guru.
 * @returns {Promise<object>}
 */
export async function getTeacherPublicProfileService(teacherId) {
    const [teacherData, courses, studentGroups] = await Promise.all([
      prisma.user.findUnique({
        where: { id: teacherId, role: 'TEACHER' },
        select: {
          name: true, avatarUrl: true, headline: true, email: true, bio: true,
          phone: true, websiteUrl: true, certifications: true, education: true, createdAt: true,
        }
      }),
      prisma.course.findMany({
        where: { teacherId: teacherId },
        include: {
          teacher: { select: { name: true, avatarUrl: true } },
          _count: { select: { reviews: true } },
          reviews: { select: { rating: true } }
        }
      }),
      prisma.booking.groupBy({
        by: ['studentId'],
        where: {
          course: { teacherId: teacherId },
          bookingStatus: { in: ['CONFIRMED', 'COMPLETED'] }
        },
      })
    ]);

    if (!teacherData) {
      throw new AppError('Teacher not found.', 404);
    }

    const coursesWithAggregates = courses.map(course => {
      const totalReviews = course._count.reviews;
      const sumOfRatings = course.reviews.reduce((acc, review) => acc + review.rating, 0);
      const averageRating = totalReviews > 0 ? sumOfRatings / totalReviews : 0;
      delete course.reviews;
      return { ...course, averageRating };
    });

    return {
      profile: teacherData,
      courses: coursesWithAggregates,
      stats: {
        totalCourses: courses.length,
        totalStudents: studentGroups.length,
      }
    };
}


/**
 * Service untuk mengambil profil lengkap user yang sedang login.
 * @param {string} userId - ID dari user yang sedang login.
 * @returns {Promise<object>}
 */
export async function getMyProfileService(userId) {
  const userProfile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, phone: true, role: true, avatarUrl: true,
      headline: true, bio: true, websiteUrl: true, certifications: true, education: true,
    }
  });

  if (!userProfile) {
    throw new AppError('User profile not found.', 404);
  }
  return userProfile;
}

/**
 * Service untuk membuat user baru.
 * @param {object} userData - Data untuk user baru.
 * @returns {Promise<object>}
 */
export async function createUserService(userData) {
  const { name, email, password, phone, role, status } = userData;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name, email, phone: phone || null,
        password: hashed, role, status: status || 'ACTIVE',
      },
      select: {
        id: true, name: true, email: true, phone: true,
        role: true, status: true, createdAt: true,
      },
    });
    return user;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const field = err.meta?.target?.join(', ');
      throw new AppError(`${field ? field.charAt(0).toUpperCase() + field.slice(1) : 'Data'} already in use.`, 400);
    }
    throw new AppError(err.message);
  }
}

/**
 * Service untuk memperbarui data user.
 * @param {string} userId - ID user yang akan diupdate.
 * @param {object} dataToUpdate - Data yang akan diperbarui.
 * @param {object} requestingUser - User yang melakukan request (untuk otorisasi).
 * @returns {Promise<object>}
 */
export async function updateUserService(userId, dataToUpdate, requestingUser) {
  if (requestingUser.id !== userId && requestingUser.role !== 'ADMIN') {
    throw new AppError('You are not authorized to update this profile', 403);
  }

  // Hanya admin yang bisa mengubah role dan status
  if (requestingUser.role !== 'ADMIN') {
    delete dataToUpdate.role;
    delete dataToUpdate.status;
  }

  // Membersihkan input password jika kosong
  if (dataToUpdate.password !== undefined && !dataToUpdate.password) {
      delete dataToUpdate.password;
  }
  
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: { 
        id: true, name: true, email: true, phone: true, role: true, status: true, 
        avatarUrl: true, headline: true, bio: true, websiteUrl: true, certifications: true, 
        education: true, bankName: true, bankAccountHolder: true, bankAccountNumber: true,
        createdAt: true, updatedAt: true,
      },
    });
    return updatedUser;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        const field = err.meta?.target?.join(', ');
        throw new AppError(`${field ? field.charAt(0).toUpperCase() + field.slice(1) : 'Data'} already in use.`, 400);
      }
      if (err.code === 'P2025') {
        throw new AppError('User not found', 404);
      }
    }
    throw new AppError(err.message || 'An unexpected error occurred during update.', 500);
  }
}

/**
 * Service untuk mengubah password user.
 * @param {string} userId - ID dari user.
 * @param {object} passwordData - { currentPassword, newPassword }.
 * @returns {Promise<void>}
 */
export async function changePasswordService(userId, { currentPassword, newPassword }) {
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    throw new AppError('Invalid input for password change.', 400);
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new AppError('Incorrect current password', 401);

  const newHashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: newHashedPassword },
  });
}

/**
 * Service untuk menghapus user.
 * @param {string} userId - ID user yang akan dihapus.
 * @returns {Promise<void>}
 */
export async function deleteUserService(userId) {
  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw new AppError('User not found', 404);
    }
    throw err;
  }
}

/**
 * Service untuk mengunggah avatar.
 * @param {string} userId - ID user.
 * @param {object} file - Objek file dari multer.
 * @returns {Promise<object>}
 */
export async function uploadAvatarService(userId, file) {
    if (!file) {
        throw new AppError('No avatar file uploaded.', 400);
    }
    const avatarUrl = `/uploads/${file.filename}`;
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
        select: { id: true, name: true, email: true, avatarUrl: true },
    });
    return updatedUser;
}

/**
 * Service untuk mengupdate info bank milik teacher.
 * @param {string} userId - ID dari teacher.
 * @param {object} payoutData - Data bank.
 * @returns {Promise<object>}
 */
export async function updateMyPayoutInfoService(userId, payoutData) {
    const { bankName, bankAccountHolder, bankAccountNumber } = payoutData;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { bankName, bankAccountHolder, bankAccountNumber },
      select: {
          id: true, name: true, email: true, role: true, avatarUrl: true,
          bankName: true, bankAccountHolder: true, bankAccountNumber: true,
      }
    });
    return updatedUser;
}