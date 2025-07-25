/*
  Warnings:

  - You are about to drop the column `bookingId` on the `TeacherPayout` table. All the data in the column will be lost.
  - You are about to drop the column `bookingSessionId` on the `TeacherPayout` table. All the data in the column will be lost.
  - You are about to drop the column `coursePriceAtBooking` on the `TeacherPayout` table. All the data in the column will be lost.
  - You are about to drop the column `serviceFeeAmount` on the `TeacherPayout` table. All the data in the column will be lost.
  - You are about to drop the column `serviceFeePercentage` on the `TeacherPayout` table. All the data in the column will be lost.
  - Added the required column `periodEndDate` to the `TeacherPayout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodStartDate` to the `TeacherPayout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalSessions` to the `TeacherPayout` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TeacherPayout" DROP CONSTRAINT "TeacherPayout_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherPayout" DROP CONSTRAINT "TeacherPayout_bookingSessionId_fkey";

-- DropIndex
DROP INDEX "TeacherPayout_bookingSessionId_key";

-- AlterTable
ALTER TABLE "BookingSession" ADD COLUMN     "payoutId" TEXT;

-- AlterTable
ALTER TABLE "TeacherPayout" DROP COLUMN "bookingId",
DROP COLUMN "bookingSessionId",
DROP COLUMN "coursePriceAtBooking",
DROP COLUMN "serviceFeeAmount",
DROP COLUMN "serviceFeePercentage",
ADD COLUMN     "periodEndDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "periodStartDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "totalSessions" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "BookingSession" ADD CONSTRAINT "BookingSession_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "TeacherPayout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
