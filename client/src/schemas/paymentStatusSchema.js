import { z } from 'zod';

export const paymentStatusSchema = z.object({
  paymentStatus: z.enum(['PENDING','PAID','FAILED',])
});
