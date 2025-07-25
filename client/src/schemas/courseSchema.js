import {z} from 'zod';
import { CLASS_LEVELS, CURRICULA } from '../config';

export const ALLOWED_SESSIONS = [6, 12, 24]; // Daftar jumlah sesi yang diizinkan
export const courseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number({ invalid_type_error: 'Price must be a number' })
    .min(0, 'Price must be a non-negative number'), // Izinkan harga 0
  classLevels: z.array(z.enum(CLASS_LEVELS)) // Validasi sebagai array enum
    .min(1, 'At least one class level must be selected'),
  curriculum: z.enum(CURRICULA).optional().or(z.literal('')),
}).refine(data => {
    const nonUtbkSelected = data.classLevels.some(level => level !== 'UTBK');
    if (!nonUtbkSelected) return true;
    return true;
}, {
    message: 'Curriculum is required for SD, SMP, or SMA levels if selected',
    path: ['curriculum'],
});


export const defaultValuesForCreate = {
  title: '',
  description: '',
  price: undefined,
  classLevels: [],
  curriculum: '',
};
