/*
  Warnings:

  - Added the required column `updatedAt` to the `BookingSession` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED_TEACHER', 'CANCELLED_STUDENT', 'STUDENT_ABSENT');

-- DropForeignKey
ALTER TABLE "BookingSession" DROP CONSTRAINT "BookingSession_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_bookingId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "courseCompletionDate" TIMESTAMP(3),
ADD COLUMN     "finalGrade" TEXT,
ADD COLUMN     "overallTeacherReport" TEXT;

-- AlterTable
ALTER TABLE "BookingSession" ADD COLUMN     "sessionCompletedAt" TIMESTAMP(3),
ADD COLUMN     "status" "SessionStatus" DEFAULT 'SCHEDULED',
ADD COLUMN     "studentAttendance" BOOLEAN,
ADD COLUMN     "teacherReport" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "BookingSession" ADD CONSTRAINT "BookingSession_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
