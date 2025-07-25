/*
  Warnings:

  - A unique constraint covering the columns `[bookingSessionId]` on the table `TeacherPayout` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "TeacherPayout_bookingId_key";

-- AlterTable
ALTER TABLE "TeacherPayout" ADD COLUMN     "bookingSessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TeacherPayout_bookingSessionId_key" ON "TeacherPayout"("bookingSessionId");

-- AddForeignKey
ALTER TABLE "TeacherPayout" ADD CONSTRAINT "TeacherPayout_bookingSessionId_fkey" FOREIGN KEY ("bookingSessionId") REFERENCES "BookingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
