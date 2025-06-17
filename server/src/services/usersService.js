import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import AppError from '../utils/AppError.mjs';
import UserRepository from '../repositories/userRepository.js';

export const getAllUsers = async (query) => {
  const { search = '', role = '', page = 1, limit = 10 } = query;
  const pageInt = parseInt(page) || 1;
  const limitInt = parseInt(limit) || 10;
  const skip = (pageInt - 1) * limitInt;

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (role) {
    where.role = role;
  }

  const total = await UserRepository.count({ where });
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
    orderBy: { name: 'asc' },
    skip,
    take: limitInt,
  });
  
  return { users, total };
};


export const getUserById = async (id) => {
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
      createdAt: true,
    },
  });
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
};

export const createUser = async ({ name, email, password, phone, role, status }) => {
  const hashed = await bcrypt.hash(password, 10);
  try {
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

// PUT /api/users/:id
export const updateUser = async (id, data) => {
  const updateData = {};
  const { name, email, phone, role, status } = data;
  if (name   !== undefined) updateData.name = name;
  if (email  !== undefined) updateData.email = email;
  if (role   !== undefined) updateData.role = role;
  if (status !== undefined) updateData.status = status;
  if (phone  !== undefined) updateData.phone = phone === '' ? null : phone;

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No fields provided to update', 400);
  }

  try {
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
    throw new AppError(err.message);
  }
};

// DELETE /api/users/:id
export const deleteUser = async (id) => {
  try {
    await UserRepository.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw new AppError('User not found', 404);
    }
    throw err;
  }
};

// upload avatar
export const uploadAvatar = async (userId, file) => {
  if (!file) {
    throw new AppError('No avatar file uploaded.', 400);
  }

  const avatarUrl = `/uploads/${file.filename}`;
  const updatedUser = await UserRepository.update({
    where: { id: userId },
    data: { avatarUrl },
    select: { id: true, name: true, email: true, avatarUrl: true },
  });
  return updatedUser;
};

 export const updateMyPayoutInfo = async (userId, { bankName, bankAccountHolder, bankAccountNumber }) => {
  const updatedUser = await UserRepository.update({
    where: { id: userId },
    data: {
      bankName,
      bankAccountHolder,
      bankAccountNumber,
    },
  });
  return {
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    avatarUrl: updatedUser.avatarUrl,
    bankName: updatedUser.bankName,
    bankAccountHolder: updatedUser.bankAccountHolder,
    bankAccountNumber: updatedUser.bankAccountNumber,
  };
};
