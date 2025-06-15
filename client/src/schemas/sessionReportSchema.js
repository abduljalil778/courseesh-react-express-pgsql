import { z } from 'zod';

export const SESSION_STATUSES = ['SCHEDULED', 'COMPLETED',];

export const sessionReportSchema = z.object({
  teacherReport: z.string().optional().or(z.literal('')),
  studentAttendance: z.boolean().optional(),
  status: z.enum(SESSION_STATUSES).optional(),
});
