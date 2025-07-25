import { z } from 'zod';

export const paymentOptionSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  accountHolder: z.string().min(1, 'Account holder name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  logoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  isActive: z.boolean(),
});