import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import AppError from '../utils/AppError.mjs';
import prisma from '../../libs/prisma.js';

// GET /api/users
export const getAllUsers = async (req, res, next) => {
  try {
    // Pagination and filtering
    const {
      search = "",
      role = "",
      page = 1,
      limit = 10
    } = req.query;
    const pageInt = parseInt(page) || 1;
    const limitInt = parseInt(limit) || 10;
    const skip = (pageInt - 1) * limitInt;
    // Filter
    const where = {};
    if (search) {
      where.OR = [
        { name:  { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (role) {
      where.role = role;
    }

    // Get total (for pagination)
    const total = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
      skip,
      take: limitInt,
    });
  // Return with total count
    res.json({
      users,
      total
    });
  } catch (err) {
    next(new AppError(err.message))
  }
};


// GET /api/users/:id
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
        select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        headline: true,
        bio: true,
        websiteUrl: true,
        certifications: true,
        education: true,
        createdAt: true,
        updatedAt: true,
        }
    });
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    res.json(user);
  } catch (err) {
    next(new AppError(err.message))
  }
};

/**
 * GET /api/users/me
 * Mengambil data profil lengkap milik user yang sedang login.
 */
export const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        headline: true,
        bio: true,
        websiteUrl: true,
        certifications: true,
        education: true,
        // Jangan sertakan password
      }
    });

    if (!userProfile) {
      return next(new AppError('User profile not found.', 404));
    }

    res.status(200).json({ data: userProfile });

  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

export const getTeacherPublicProfile = async (req, res, next) => {
  try {
    const { teacherId } = req.params;

    const [teacherData, courses, studentGroups] = await Promise.all([
      prisma.user.findUnique({
        where: { id: teacherId, role: 'TEACHER' },
        select: {
          name: true,
          avatarUrl: true,
          headline: true,
          email: true,
          bio: true,
          phone:true,
          websiteUrl: true,
          certifications: true,
          education: true,
          createdAt: true,
        }
      }),

      prisma.course.findMany({
        where: { teacherId: teacherId },
        include: {
          teacher: {
            select: {
              name: true,
              avatarUrl: true,
            }
          },
          _count: { select: { reviews: true } },
          reviews: { select: { rating: true } }
        }
      }),

      prisma.booking.groupBy({
        by: ['studentId'], // Kelompokkan berdasarkan kolom ini
        where: {
          course: { teacherId: teacherId },
          bookingStatus: { in: ['CONFIRMED', 'COMPLETED'] }
        },
      })
    ]);

    if (!teacherData) {
      return next(new AppError('Teacher not found.', 404));
    }

    const coursesWithAggregates = courses.map(course => {
      const totalReviews = course._count.reviews;
      const sumOfRatings = course.reviews.reduce((acc, review) => acc + review.rating, 0);
      const averageRating = totalReviews > 0 ? sumOfRatings / totalReviews : 0;
      delete course.reviews;
      return { ...course, averageRating };
    });

    const totalStudents = studentGroups.length;

    res.json({
      data: { 
        profile: teacherData,
        courses: coursesWithAggregates,
        stats: {
          totalCourses: courses.length,
          totalStudents: totalStudents 
        }
      }
    });

  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

// POST /api/users
export const createUser = async (req, res, next) => {
  const {name, email, password, phone, role, status} = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashed,
        role,
        status: status || 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    res.status(201).json(user)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const field = err.meta?.target?.join(', ');
      return next(
        new AppError(
          `${field ? field.charAt(0).toUpperCase() + field.slice(1) : 'Data'} already in use.`,
          400
        )
      );
    }
    throw new AppError(err.message);
  }
}

export const updateUser = async (req, res, next) => {
    const { id } = req.params;
    // console.log('UPDATE USER: Received req.body:', req.body);
    // Ambil semua field dari body
    let { name, email, phone, role, status, headline, bio, websiteUrl, certifications, education } = req.body;
    
    // Pastikan user hanya bisa update datanya sendiri (kecuali admin)
    if (req.user.id !== id && req.user.role !== 'ADMIN') {
      return next(new AppError('You are not authorized to update this profile', 403));
    }
    
    const dataToUpdate = {};

    // Mengisi data untuk diupdate
    if (name !== undefined) dataToUpdate.name = name;
    if (phone !== undefined) dataToUpdate.phone = phone === '' ? null : phone;
    if (headline !== undefined) dataToUpdate.headline = headline;
    if (bio !== undefined) dataToUpdate.bio = bio;
    if (websiteUrl !== undefined) dataToUpdate.websiteUrl = websiteUrl;
    if (certifications != undefined) dataToUpdate.certifications = certifications;
    if (education != undefined) dataToUpdate.education = education;
    if (email !== undefined) dataToUpdate.email = email;

    // Hanya admin yang bisa mengubah email, role, dan status untuk keamanan
    if (req.user.role === 'ADMIN') {
        if (role !== undefined) dataToUpdate.role = role;
        if (status !== undefined) dataToUpdate.status = status;
    }
    
    // --- PENANGANAN ARRAY YANG LEBIH AMAN ---
    const arrayFields = { certifications, education };
    for (const [key, value] of Object.entries(arrayFields)) {
      if (value !== undefined) {
        let parsedArray = [];
        if (typeof value === 'string' && value) {
          try {
            parsedArray = JSON.parse(value);
          } catch (e) {
            return next(new AppError(`Invalid JSON format for ${key}. Received: ${value}`, 400));
          }
        } else if (Array.isArray(value)) {
          parsedArray = value;
        }
        dataToUpdate[key] = parsedArray.filter(item => typeof item === 'string' && item.trim() !== '');
      }
    }

    if (Object.keys(dataToUpdate).length === 0 && !req.file) { // Cek req.file juga
        return next(new AppError('No fields provided to update', 400));
    }

    // console.log('UPDATE USER: Data being sent to Prisma:', dataToUpdate);

    try {
        const updatedUser = await prisma.user.update({
            where: { id },
            data: dataToUpdate,
            select: { 
                id: true, 
                name: true, 
                email: true, 
                phone: true, 
                role: true,
                status: true, 
                avatarUrl: true, 
                headline: true, 
                bio: true,
                websiteUrl: true, 
                certifications: true, 
                education: true,
                bankName: true, 
                bankAccountHolder: true, 
                bankAccountNumber: true,
                createdAt: true, 
                updatedAt: true,
            },
        });
        
        return res.json({ data: updatedUser });
    
    } catch (err) {
      console.error("!!! UPDATE USER FAILED !!!");
      console.error("Error details:", err);
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          const field = err.meta?.target?.join(', ');
          return next(
            new AppError(
              `${field ? field.charAt(0).toUpperCase() + field.slice(1) : 'Data'} already in use.`,
              400
            )
          );
        }
        if (err.code === 'P2025') {
          return next(new AppError('User not found', 404));
        }
      }
      return next(new AppError(err.message || 'An unexpected error occurred during update.', 500));
    }
};


/**
 * PUT /api/users/me/change-password
 * User mengubah password mereka sendiri.
 */
export const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Please provide current and new password', 400));
  }

  if (newPassword.length < 6) {
    return next(new AppError('New password must be at least 6 characters', 400));
  }

  try {
    // 1. Ambil data user dari DB, termasuk hash passwordnya
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // 2. Bandingkan password saat ini yang diinput dengan yang ada di DB
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return next(new AppError('Incorrect current password', 401)); // 401 Unauthorized
    }

    // 3. Jika cocok, hash password yang baru
    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update password di database
    await prisma.user.update({
      where: { id: userId },
      data: { password: newHashedPassword },
    });

    // 5. Kirim respons sukses tanpa data sensitif
    res.status(200).json({ message: 'Password changed successfully.' });

  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

// DELETE /api/users/:id
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return next(new AppError('User not found', 404));
    }
    next(err);
  }
};

// upload avatar
export const uploadAvatar = async (req, res, next) => {
  try {
    const userId = req.user.id;

  if (!req.file) {
    return next(new AppError('No avatar file uploaded.', 400));
  }

  const avatarUrl = `/uploads/${req.file.filename}`;
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: avatarUrl },
    select: { id: true, name: true, email: true, avatarUrl: true },
  });
  res.json(updatedUser);
  } catch (err) {
    next(new AppError(err.message));
  }
}


 /**
 * PUT /api/teachers/me/payout-info
 * Teacher mengupdate informasi bank mereka sendiri.
 */
  export const updateMyPayoutInfo = async (req, res, next) => {
  const { id: userId } = req.user;
  const { bankName, bankAccountHolder, bankAccountNumber } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        bankName,
        bankAccountHolder,
        bankAccountNumber,
      },
    });
    res.json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatarUrl,
        bankName: updatedUser.bankName,
        bankAccountHolder: updatedUser.bankAccountHolder,
        bankAccountNumber: updatedUser.bankAccountNumber,
    });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
}