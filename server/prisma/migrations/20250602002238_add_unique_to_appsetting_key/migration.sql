/*
  Warnings:

  - A unique constraint covering the columns `[key]` on the table `ApplicationSetting` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ApplicationSetting_key_key" ON "ApplicationSetting"("key");
