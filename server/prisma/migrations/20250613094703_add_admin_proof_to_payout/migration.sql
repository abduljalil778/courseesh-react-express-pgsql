/*
  Warnings:

  - The values [PENDING_CALCULATION] on the enum `PayoutStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PayoutStatus_new" AS ENUM ('PENDING_PAYMENT', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED');
ALTER TABLE "TeacherPayout" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "TeacherPayout" ALTER COLUMN "status" TYPE "PayoutStatus_new" USING ("status"::text::"PayoutStatus_new");
ALTER TYPE "PayoutStatus" RENAME TO "PayoutStatus_old";
ALTER TYPE "PayoutStatus_new" RENAME TO "PayoutStatus";
DROP TYPE "PayoutStatus_old";
ALTER TABLE "TeacherPayout" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT';
COMMIT;

-- AlterTable
ALTER TABLE "TeacherPayout" ADD COLUMN     "adminProofOfPaymentUrl" TEXT;
