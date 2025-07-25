/*
  Warnings:

  - You are about to drop the column `classLevel` on the `Course` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Course" DROP COLUMN "classLevel",
ADD COLUMN     "classLevels" "ClassLevel"[];
