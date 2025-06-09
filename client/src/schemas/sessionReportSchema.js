import { z } from 'zod';

export const SESSION_STATUSES = ['SCHEDULED', 'COMPLETED', 'CANCELLED_TEACHER', 'CANCELLED_STUDENT', 'STUDENT_ABSENT'];

export const sessionReportSchema = z.object({
  teacherReport: z.string().optional().or(z.literal('')),
  studentAttendance: z.boolean().optional(),
  status: z.enum(SESSION_STATUSES).optional(),
});
