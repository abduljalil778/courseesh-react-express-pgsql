import prisma from '../../libs/prisma.js';
import AppError from '../utils/AppError.mjs';
import { BookingStatus, SessionStatus } from '@prisma/client';

/**
 * Service untuk mengambil jadwal tidak tersedia milik guru yang sedang login.
 * Menggabungkan jadwal yang di-set manual dan yang sudah di-booking.
 * @param {object} user - Objek user guru yang sedang login.
 * @returns {Promise<Array>}
 */
export async function getMyUnavailableDatesService(user) {
  const teacherId = user.id;

  const manuallyUnavailable = await prisma.teacherUnavailableDate.findMany({
    where: { teacherId },
    select: { id: true, date: true },
  });

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
  
  const allUnavailableSlots = [...manualSlots, ...bookedSlots]
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return allUnavailableSlots;
}

/**
 * Service untuk menambahkan slot-slot waktu tidak tersedia untuk guru.
 * @param {string[]} dates - Array berisi tanggal dalam format ISO string.
 * @param {object} user - User guru yang sedang login.
 */
export async function addUnavailableSlotsService(dates, user) {
  const teacherId = user.id;

  if (!Array.isArray(dates) || dates.length === 0) {
    throw new AppError('Please provide an array of date strings.', 400);
  }

  const dataToCreate = dates.map(dateStr => {
    if (isNaN(new Date(dateStr).getTime())) {
      throw new AppError(`Invalid date format provided: ${dateStr}`, 400);
    }
    return {
      date: new Date(dateStr),
      teacherId: teacherId,
    };
  });

  await prisma.teacherUnavailableDate.createMany({
    data: dataToCreate,
    skipDuplicates: true,
  });
}

/**
 * Service untuk menghapus jadwal tidak tersedia yang di-set manual.
 * @param {string} unavailableDateId - ID dari record TeacherUnavailableDate.
 * @param {object} user - User guru yang sedang login.
 */
export async function removeUnavailableDateService(unavailableDateId, user) {
  const teacherId = user.id;

  const entryToDelete = await prisma.teacherUnavailableDate.findUnique({
    where: { id: unavailableDateId },
  });

  if (!entryToDelete) {
    throw new AppError('Unavailable date entry not found.', 404);
  }

  if (entryToDelete.teacherId !== teacherId) {
    throw new AppError('You are not authorized to delete this entry.', 403);
  }

  await prisma.teacherUnavailableDate.delete({
    where: { id: unavailableDateId },
  });
}

/**
 * Service untuk mengambil jadwal tidak tersedia (manual & booking) dari seorang guru berdasarkan ID.
 * digunakan oleh siswa saat akan booking.
 * @param {string} teacherId - ID dari guru.
 * @returns {Promise<Array>}
 */
export async function getTeacherScheduleService(teacherId) {
  const manuallyUnavailable = await prisma.teacherUnavailableDate.findMany({
    where: { teacherId: teacherId },
    select: { date: true, id: true }
  });

  const bookedSessions = await prisma.bookingSession.findMany({ 
    where: {
      status: { not: SessionStatus.COMPLETED },
      booking: {
        course: { teacherId: teacherId },
        bookingStatus: { not: BookingStatus.CANCELLED }
      }
    },
    select: { sessionDate: true }
  });

  const manuallyUnavailableDates = manuallyUnavailable.map(item => ({ date: item.date }));
  const bookedDates = bookedSessions.map(item => ({ date: item.sessionDate }));

  return [...manuallyUnavailableDates, ...bookedDates];
}