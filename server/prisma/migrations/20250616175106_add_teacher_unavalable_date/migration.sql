-- CreateTable
CREATE TABLE "TeacherUnavailableDate" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherUnavailableDate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeacherUnavailableDate_teacherId_date_key" ON "TeacherUnavailableDate"("teacherId", "date");

-- AddForeignKey
ALTER TABLE "TeacherUnavailableDate" ADD CONSTRAINT "TeacherUnavailableDate_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
