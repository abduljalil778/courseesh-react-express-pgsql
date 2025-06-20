// src/utils/timeUtils.js
import { format } from 'date-fns';

/**
 * Menghasilkan array dari slot waktu dalam format HH:mm.
 * @param {string} start - Waktu mulai, format "HH:mm".
 * @param {string} end - Waktu akhir, format "HH:mm".
 * @param {number} step - Interval dalam menit.
 * @returns {string[]} - Array dari slot waktu.
 */
export const generateTimeSlots = (start = "07:00", end = "21:00", step = 120) => {
  const slots = [];
  // Buat tanggal acuan untuk kalkulasi
  let currentTime = new Date(`1970-01-01T${start}:00`);
  const endTime = new Date(`1970-01-01T${end}:00`);

  while (currentTime <= endTime) {
    slots.push(format(currentTime, "HH:mm"));
    // Tambahkan menit sesuai `step` untuk iterasi berikutnya
    currentTime.setMinutes(currentTime.getMinutes() + step);
  }
  return slots;
};