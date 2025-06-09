/*
  Warnings:

  - The values [GRADE1,GRADE2,GRADE3,GRADE4,GRADE5,GRADE6,GRADE7,GRADE8,GRADE9,GRADE10,GRADE11,GRADE12] on the enum `ClassLevel` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ClassLevel_new" AS ENUM ('SD', 'SMP', 'SMA', 'UTBK');
ALTER TABLE "Course" ALTER COLUMN "classLevel" TYPE "ClassLevel_new" USING ("classLevel"::text::"ClassLevel_new");
ALTER TYPE "ClassLevel" RENAME TO "ClassLevel_old";
ALTER TYPE "ClassLevel_new" RENAME TO "ClassLevel";
DROP TYPE "ClassLevel_old";
COMMIT;
