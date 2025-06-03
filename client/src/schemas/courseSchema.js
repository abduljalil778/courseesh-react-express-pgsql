import {z} from 'zod';
import { CLASS_LEVELS, CURRICULA } from '../config';

export const courseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  price: z
    .number({ invalid_type_error: 'Price must be a number' })
    .positive('Price must be greater than 0')
    .or(z.literal(0).transform(() => 0)), // Izinkan 0 atau angka positif
  numberOfSessions: z
    .number({ invalid_type_error: 'Number of sessions is required' })
    .int('Number of sessions must be an integer')
    .min(1, 'At least 1 session is required'),
  classLevel: z.enum(CLASS_LEVELS, {
    errorMap: () => ({ message: 'Please select a valid class level' }),
  }),
  curriculum: z.enum(CURRICULA).optional().or(z.literal('')), // Izinkan string kosong jika opsional
});