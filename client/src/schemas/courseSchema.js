import {z} from 'zod';
import { CLASS_LEVELS, CURRICULA } from '../config';

export const ALLOWED_SESSIONS = [6, 12, 24]; // Daftar jumlah sesi yang diizinkan
export const courseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  price: z
    .number({ invalid_type_error: 'Price must be a number' })
    .positive('Price must be greater than 0')
    .or(z.literal(0).transform(() => 0)),
  numberOfSessions: z.coerce // Gunakan coerce untuk mengubah string dari select menjadi number
    .number()
    .refine(val => ALLOWED_SESSIONS.includes(val), {
      message: `Number of sessions must be one of: ${ALLOWED_SESSIONS.join(', ')}`,
    }),
  classLevel: z.enum(CLASS_LEVELS, { //
    errorMap: () => ({ message: 'Please select a valid class level' }),
  }),
  curriculum: z.enum(CURRICULA).optional().or(z.literal('')), //
});

export const defaultValuesForCreate = {
  title: '',
  description: '',
  price: undefined,
  numberOfSessions: ALLOWED_SESSIONS[0], // Default ke opsi pertama (6 sesi)
  classLevel: CLASS_LEVELS[0] || '', // Default ke opsi pertama
  curriculum: CURRICULA[0] || '', // Default ke opsi pertama
};