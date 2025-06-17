import {Prisma} from '@prisma/client';
import bcrypt from 'bcryptjs';
import AppError from '../utils/AppError.mjs';
import UserRepository from '../repositories/userRepository.js';

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
    const total = await UserRepository.count({ where });

    // Fetch users for this page
    const users = await UserRepository.findMany({
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
    const user = await UserRepository.findUnique({
      where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          avatarUrl: true,
          createdAt: true
        }
    });
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    res.json(user);
  } catch (err) {
    next(new AppError(err.message))
  }
}

// POST /api/users
export const createUser = async (req, res, next) => {
  const {name, email, password, phone, role, status} = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await UserRepository.create({
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
      }
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
    next(new AppError(err.message));
  }
}

// PUT /api/users/:id
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, password, role, status } = req.body;
    const data = {};
    if (name   != undefined) data.name   = name;
    if (email  != undefined) data.email  = email;
    if (role   != undefined) data.role   = role;
    if (status != undefined) data.status = status;
    if (phone  != undefined) data.phone  = phone === '' ? null : phone;

    
    if (Object.keys(data).length === 0) {
      return next(new AppError('No fields provided to update', 400));
    }

    const updatedUser = await UserRepository.update({
      where: { id },
      data: data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    return res.json(updatedUser);
  } catch (err) {
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
    next(new AppError(err.message));
  }
};

// DELETE /api/users/:id
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await UserRepository.delete({
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
  const updatedUser = await UserRepository.update({
    where: { id: userId },
    data: { avatarUrl: avatarUrl },
    select: { id: true, name: true, email: true, avatarUrl: true }
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
    const updatedUser = await UserRepository.update({
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
