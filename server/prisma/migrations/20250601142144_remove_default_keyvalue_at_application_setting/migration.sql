-- DropIndex
DROP INDEX "ApplicationSetting_key_key";

-- AlterTable
ALTER TABLE "ApplicationSetting" ALTER COLUMN "key" DROP DEFAULT,
ALTER COLUMN "value" DROP DEFAULT;
