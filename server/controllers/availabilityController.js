import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError.mjs';

const prisma = new PrismaClient();

export const getMyUnavailableDates = async (req, res, next) => {
  try {
    const dates = await prisma.teacherUnavailableDate.findMany({
      where: { teacherId: req.user.id },
      orderBy: { date: 'asc' },
    });
    res.json(dates);
  } catch (err) {
    next(new AppError(err.message || 'Failed to fetch unavailable dates', 500));
  }
};

export const addUnavailableDate = async (req, res, next) => {
  const { date } = req.body;
  if (!date || isNaN(new Date(date))) {
    return next(new AppError('Invalid date', 400));
  }
  try {
    const entry = await prisma.teacherUnavailableDate.create({
      data: { teacherId: req.user.id, date: new Date(date) },
    });
    res.status(201).json(entry);
  } catch (err) {
    if (err.code === 'P2002') {
      return next(new AppError('Date already marked unavailable', 400));
    }
    next(new AppError(err.message || 'Failed to add unavailable date', 500));
  }
};

export const removeUnavailableDate = async (req, res, next) => {
  const { id } = req.params;
  try {
    await prisma.teacherUnavailableDate.delete({
      where: { id },
    });
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(new AppError(err.message || 'Failed to delete unavailable date', 500));
  }
};