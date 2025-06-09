import {z} from 'zod';
import { CLASS_LEVELS, CURRICULA } from '../config';

export const ALLOWED_SESSIONS = [6, 12, 24]; // Daftar jumlah sesi yang diizinkan
export const courseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number({ invalid_type_error: 'Price must be a number' })
    .min(0, 'Price must be a non-negative number'), // Izinkan harga 0
  numberOfSessions: z.coerce
    .number()
    .refine(val => ALLOWED_SESSIONS.includes(val), {
      message: `Number of sessions must be one of: ${ALLOWED_SESSIONS.join(', ')}`,
    }),
  classLevels: z.array(z.enum(CLASS_LEVELS)) // Validasi sebagai array enum
    .min(1, 'At least one class level must be selected'),
  curriculum: z.enum(CURRICULA).optional().or(z.literal('')),
}).refine(data => { // Logika untuk curriculum
    const nonUtbkSelected = data.classLevels.some(level => level !== 'UTBK');
    // Jika tidak ada level non-UTBK yang dipilih (misal hanya UTBK, atau tidak ada sama sekali), curriculum tidak wajib
    if (!nonUtbkSelected) return true;
    // Jika ada level non-UTBK, dan curriculum tidak diisi, maka error (kecuali jika memang opsional total)
    // Jika curriculum wajib untuk SD/SMP/SMA, maka:
    // return !!data.curriculum; 
    // Jika curriculum opsional bahkan untuk SD/SMP/SMA:
    return true;
}, {
    message: 'Curriculum is required for SD, SMP, or SMA levels if selected',
    path: ['curriculum'], // Tampilkan error di field curriculum
});


export const defaultValuesForCreate = {
  title: '',
  description: '',
  price: undefined,
  numberOfSessions: ALLOWED_SESSIONS[0],
  classLevels: [], // Default ke array kosong
  curriculum: '',
};
