-- CreateEnum
CREATE TYPE "SubjectCategory" AS ENUM ('MTK', 'BAHASA_INGGRIS', 'BAHASA_INDONESIA', 'FISIKA', 'KIMIA', 'BIOLOGI', 'SOSIOLOGI', 'EKONOMI', 'GEOGRAFI', 'IPAS', 'IPA', 'IPS', 'UMUM');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "category" "SubjectCategory" NOT NULL DEFAULT 'UMUM';
