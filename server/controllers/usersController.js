// server/controllers/usersController.js
import {PrismaClient, Prisma} from '@prisma/client';
import bcrypt from 'bcryptjs';
import AppError from '../utils/AppError.mjs';
import { findAllUsers } from '../libs/usersRepository.js';
const prisma = new PrismaClient();

// GET /api/users
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await findAllUsers()
    res.json(users);
  } catch (err) {
    next(new AppError(err.message))
  }
};

// GET /api/users/:id
export const getUserById = async (req, res, next) => {
  try {
    const {id} = req.params
    const user = await prisma.user.findUnique({
      where: {
        id: {id}
      }, select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true
      }
    });
    if (!user) {
      return new AppError(({message: 'User not found'}))
    }
    res.json(user)
  } catch (err) {
    next(new AppError(err.message))
  }
}

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
      }
    });
    res.status(201).json(user)
    
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const field = err.meta?.target?.join(', ');
      return new AppError({ message: `${field ? field.charAt(0).toUpperCase() + field.slice(1) : 'Data'} already in use.` });
    }
    next(new AppError(err.message));
  }
}

// PUT /api/users/:id
export const updateUser = async (req, res, next) => {
  try {
    const id = req.params;
    const { name, email, phone, password, role, status } = req.body;
    const data = {};
    if (name   != undefined) data.name   = name;
    if (email  != undefined) data.email  = email;
    if (role   != undefined) data.role   = role;
    if (status != undefined) data.status = status;
    if (phone  != undefined) data.phone  = phone === '' ? null : phone; // simpan null jika tidak diisi

    
    if (Object.keys(data).length === 0) {
      return new AppError({ message: 'No fields provided to update' })
    }

    const updatedUser = await prisma.user.update({
      where: id,
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
      if (err.code === 'P2002') { // Unique constraint (misal email)
        const field = err.meta?.target?.join(', ');
        return new AppError({ message: `${field ? field.charAt(0).toUpperCase() + field.slice(1) : 'Data'} already in use.` });
      }
      if (err.code === 'P2025') { // Record to update not found
        return new AppError({ message: 'User not found' });
      }
    }
    next(new AppError(err.message));
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return new AppError({ message: 'User not found' });
    }
    next(err);
  }
};