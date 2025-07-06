import UserRepository from '../repositories/userRepository.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import AppError from '../utils/AppError.mjs';

dotenv.config();
const JWT_EXPIRES_IN = '1d';

/**
 * POST /api/auth/register
 * Body: { name, email, password, [role] }
 * By default, new users get STUDENT role unless specified.
 */
export const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const existing = await UserRepository.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await UserRepository.create({
      data: {
        name,
        email,
        password: hashed,
        role: role?.toUpperCase() ?? 'STUDENT'
      }
    });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl
      },
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await UserRepository.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status !== 'ACTIVE') {
    return res.status(403).json({message: "Your account is inactive, please contact administrator"});
  }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    res.json({
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        avatarUrl: user.avatarUrl,
      },
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
};