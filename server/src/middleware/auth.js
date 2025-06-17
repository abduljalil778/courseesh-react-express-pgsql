// src/middleware/auth.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import prisma from '../../libs/prisma.js';

dotenv.config();

/**
 * Verify JWT and attach user to req.user
 */
export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: no token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(401).json({ message: 'Unauthorized: user not found' });
    if (user.status !== 'ACTIVE') {
     return res.status(403).json({message: 'Your account is inactive'});
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Forbidden: invalid token' });
  }
};

/**
 * Restrict to specific roles
 * @param  {...string} allowedRoles e.g. 'ADMIN', 'TEACHER'
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient privileges' });
    }
    next();
  };
};
