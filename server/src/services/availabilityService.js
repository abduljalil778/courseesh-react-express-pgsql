import prisma from '../../libs/prisma.js';
import AppError from '../utils/AppError.mjs';
import { BookingStatus, SessionStatus } from '@prisma/client'; 

export const getMyUnavailableDates = async (req, res, next) => {
  try {
    const { id } = req.user
    const dates = await prisma.teacherUnavailableDate.findMany({
      where: { teacherId: id },
      orderBy: { date: 'asc' },
    });
    const bookedSessions = await prisma.bookingSession.findMany({
      where: {
        status: {
          not: SessionStatus.COMPLETED // <-- Hanya ambil sesi yang BELUM SELESAI
        },
        booking: {
          course:{
            teacherId: id
          },
          bookingStatus: {
            not: BookingStatus.CANCELLED
          }
        }
      },
      select: { sessionDate: true }
    });

    const manuallyUnavailableDates = dates.map(item => ({ date: item.date }));
    const bookedDates = bookedSessions.map(item => ({ date: item.sessionDate }));

    const allUnavailableSlots = [...manuallyUnavailableDates, ...bookedDates];

    res.json(allUnavailableSlots);
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

export const addUnavailableSlots = async (req, res, next) => {
  const { dates } = req.body; // Mengharapkan { dates: ["ISO_STRING_1", "ISO_STRING_2", ...] }
  const teacherId = req.user.id;

  if (!Array.isArray(dates) || dates.length === 0) {
    return next(new AppError('Please provide an array of date strings.', 400));
  }

  // Ubah array string menjadi format yang bisa diterima Prisma
  const dataToCreate = dates.map(dateStr => ({
    date: new Date(dateStr),
    teacherId: teacherId,
  }));

  try {
    // Gunakan createMany untuk efisiensi
    await prisma.teacherUnavailableDate.createMany({
      data: dataToCreate,
      skipDuplicates: true, // Abaikan jika ada duplikat untuk mencegah error
    });
    res.status(201).json({ message: 'Unavailable slots added successfully.' });
  } catch (err) {
    next(new AppError('Failed to add unavailable slots.', 500));
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


export const getUnavailableDatesByTeacherId = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = await prisma.teacherUnavailableDate.findMany({
      where: { teacherId: id },
      select: {
        date: true,
      }
    });
    res.json(data);
  } catch (err) {
    next(new AppError(err.message || 'Failed to fetch unavailable dates by teacher ID', 500));
  }
};



export const getTeacherSchedule = async (req, res, next) => {
  try {
    const { id: teacherId } = req.params;
    
    const manuallyUnavailable = await prisma.teacherUnavailableDate.findMany({
      where: { teacherId: teacherId },
      select: { date: true }
    });

    const bookedSessions = await prisma.bookingSession.findMany({ 
      where: {
        status: { not: SessionStatus.COMPLETED },
        booking: {
          course: {
            teacherId: teacherId
          }
        }
      },
      select: {
        sessionDate: true
      }
    });

    const manuallyUnavailableDates = manuallyUnavailable.map(item => ({ date: item.date }));
    const bookedDates = bookedSessions.map(item => ({ date: item.sessionDate }));

    const allUnavailableSlots = [...manuallyUnavailableDates, ...bookedDates];

    res.json({ data: allUnavailableSlots });

  } catch (err) {
    next(new AppError(err.message || 'Failed to fetch teacher schedule', 500));
  }
};