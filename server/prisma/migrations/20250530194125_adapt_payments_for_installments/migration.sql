/*
  Warnings:

  - Added the required column `installmentNumber` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "installmentNumber" INTEGER NOT NULL,
ADD COLUMN     "paymentGatewayRef" TEXT;
