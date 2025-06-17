import UserRepository from '../repositories/userRepository.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import AppError from '../utils/AppError.mjs';

dotenv.config();
const JWT_EXPIRES_IN = '1d'; 

export const register = async ({ name, email, password, role }) => {
  const existing = await UserRepository.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('Email already in use', 400);
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await UserRepository.create({
    data: {
      name,
      email,
      password: hashed,
      role: role?.toUpperCase() ?? 'STUDENT',
    },
  });
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
    token,
  };
};

export const login = async ({ email, password }) => {
  const user = await UserRepository.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new AppError('Invalid credentials', 401);
  }
  if (user.status !== 'ACTIVE') {
    throw new AppError('Your account is inactive, please contact administrator', 403);
  }
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
    token,
  };
};
