import { z } from 'zod';

const PHONE_REGEX = /^\+?[0-9]{10,15}$/;

export const baseUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().regex(PHONE_REGEX, 'Enter a valid phone number'),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT', 'FINANCE'], {
    errorMap: () => ({ message: 'Please select a valid role.' }),
  }),
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    errorMap: () => ({ message: 'Please select a valid status.' }),
  }),
});

// Skema untuk membuat user baru (password wajib)
export const createUserSchema = baseUserSchema.extend({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Skema untuk mengupdate user (password opsional)
export const updateUserSchema = baseUserSchema.extend({
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters if provided')
    .optional()
    .or(z.literal('')), // Izinkan string kosong, akan dihapus sebelum submit jika kosong
});