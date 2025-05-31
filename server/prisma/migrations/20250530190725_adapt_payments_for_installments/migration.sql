/*
  Warnings:

  - You are about to drop the column `installments` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `method` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'FULL',
ADD COLUMN     "totalInstallments" INTEGER;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "installments",
DROP COLUMN "method";
