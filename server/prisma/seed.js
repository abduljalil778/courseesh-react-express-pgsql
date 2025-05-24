// prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';      // only if you need to hash passwords
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  // 1) Create an Admin user
  const adminPass = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name:     'Super Admin',
      email:    'admin@example.com',
      password: adminPass,
      role:     'ADMIN',
    },
  });

  // 2) Create a Teacher
  const teacherPass = await bcrypt.hash('teach123', 10);
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {},
    create: {
      name:     'Tutor Ms. Romlah',
      email:    'teacher@example.com',
      password: teacherPass,
      role:     'TEACHER',
    },
  });

  // 3) Create a Student
  const studentPass = await bcrypt.hash('stud1234', 10);
  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      name:     'Student Joko',
      email:    'student@example.com',
      password: studentPass,
      role:     'STUDENT',
    },
  });

  // 4) Create a couple of Courses
  const course1 = await prisma.course.upsert({
    where: { id: 'Intro to Algebra' },
    update: {},
    create: {
      title:       'Intro to Algebra',
      description: 'Basic algebraic concepts, 1-on-1',
      price:       100.0,
      teacherId:   teacher.id
    }
  });
  const course2 = await prisma.course.upsert({
    where: { id: 'English Conversation' },
    update: {},
    create: {
      title:       'English Conversation',
      description: 'Practice speaking in everyday scenarios',
      price:       120.0,
      teacherId:   teacher.id
    }
  });

  // 5) Create a sample Booking
  await prisma.booking.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id:          '00000000-0000-0000-0000-000000000001',
      bookingDate: new Date(Date.now() + 7 * 24*60*60*1000), // a week from now
      status:      'PENDING',
      studentId:   student.id,
      courseId:    course1.id
    }
  });

  console.log('✅ Seed data created.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
