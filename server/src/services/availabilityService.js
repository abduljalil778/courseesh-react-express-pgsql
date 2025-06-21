import prisma from '../../libs/prisma.js';
import AppError from '../utils/AppError.mjs';
import { BookingStatus, SessionStatus } from '@prisma/client'; 

export const getMyUnavailableDates = async (req, res, next) => {
  try {
    const teacherId = req.user.id;

    // 1. Ambil jadwal yang di-set manual (ini yang bisa dihapus)
    const manuallyUnavailable = await prisma.teacherUnavailableDate.findMany({
      where: { teacherId },
      select: { id: true, date: true },
    });

    // 2. Ambil jadwal dari booking siswa (ini tidak bisa dihapus oleh guru)
    const bookedSessions = await prisma.bookingSession.findMany({
      where: {
        status: { not: SessionStatus.COMPLETED },
        booking: {
          course: { teacherId: teacherId },
          bookingStatus: { not: BookingStatus.CANCELLED }
        }
      },
      select: { id: true, sessionDate: true },
    });

    // 3. Gabungkan keduanya
    const manualSlots = manuallyUnavailable.map(item => ({
      id: item.id,
      date: item.date,
      isDeletable: true,
      type: 'Personal Schedule'
    }));

    const bookedSlots = bookedSessions.map(item => ({
      id: item.id,
      date: item.sessionDate,
      isDeletable: false,
      type: 'Booked'
    }));
    
    // Gabungkan dan urutkan berdasarkan tanggal
    const allUnavailableSlots = [...manualSlots, ...bookedSlots]
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ data: allUnavailableSlots });

  } catch (err) {
    next(new AppError(err.message || 'Failed to fetch unavailable dates', 500));
  }
};

// export const addUnavailableDate = async (req, res, next) => {
//   const { date } = req.body;
//   if (!date || isNaN(new Date(date))) {
//     return next(new AppError('Invalid date', 400));
//   }
//   try {
//     const entry = await prisma.teacherUnavailableDate.create({
//       data: { teacherId: req.user.id, date: new Date(date) },
//     });
//     res.status(201).json(entry);
//   } catch (err) {
//     if (err.code === 'P2002') {
//       return next(new AppError('Date already marked unavailable', 400));
//     }
//     next(new AppError(err.message || 'Failed to add unavailable date', 500));
//   }
// };

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
      skipDuplicates: true,
    });
    res.status(201).json({ message: 'Unavailable slots added successfully.' });
  } catch (err) {
    next(new AppError('Failed to add unavailable slots.', 500));
  }
};

export const removeUnavailableDate = async (req, res, next) => {
  try {
    const { id: unavailableDateId } = req.params;
    const teacherId = req.user.id;
    const entryToDelete = await prisma.teacherUnavailableDate.findUnique({
      where: { id: unavailableDateId },
    });

    if (!entryToDelete) {
      return next(new AppError('Unavailable date entry not found.', 404));
    }

    if (entryToDelete.teacherId !== teacherId) {
      return next(new AppError('You are not authorized to delete this entry.', 403));
    }
    await prisma.teacherUnavailableDate.delete({
      where: { id: unavailableDateId },
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
        id: true,
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
      select: { date: true, id: true }
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