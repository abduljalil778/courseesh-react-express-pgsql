import UserRepository from '../repositories/userRepository.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.mjs';

const JWT_EXPIRES_IN = '1d';

/**
 * Service untuk registrasi user baru.
 * @param {object} userData - Data user { name, email, password, role }.
 * @returns {Promise<{user: object, token: string}>} Objek berisi data user dan token.
 */
export async function registerService(userData) {
  const { name, email, password, role } = userData;

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

  // Hapus password dari objek user sebelum dikirim kembali
  const userWithoutPassword = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };

  return { user: userWithoutPassword, token };
}

/**
 * Service untuk login user.
 * @param {object} credentials - Kredensial user { email, password }.
 * @returns {Promise<{user: object, token: string}>} Objek berisi data user dan token.
 */
export async function loginService(credentials) {
  const { email, password } = credentials;

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

  const userWithoutPassword = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };

  return { user: userWithoutPassword, token };
}