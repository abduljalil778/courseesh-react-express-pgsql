/*
  Warnings:

  - You are about to drop the column `paymentGatewayRef` on the `Payment` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('GENERAL', 'BOOKING_STATUS', 'PAYMENT_STATUS', 'NEW_MESSAGE');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "type" "NotificationType" NOT NULL DEFAULT 'GENERAL';

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "paymentGatewayRef";
