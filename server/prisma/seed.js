// // prisma/seed.js
// import { PrismaClient } from '@prisma/client';
// import bcrypt from 'bcryptjs';      // only if you need to hash passwords
// import dotenv from 'dotenv';

// dotenv.config();
// const prisma = new PrismaClient();

// async function main() {
//   // 1) Create an Admin user
//   const adminPass = await bcrypt.hash('admin123', 10);
//   const admin = await prisma.user.upsert({
//     where: { email: 'admin@example.com' },
//     update: {},
//     create: {
//       name:     'Super Admin',
//       email:    'admin@example.com',
//       password: adminPass,
//       role:     'ADMIN',
//     },
//   });

//   // 2) Create a Teacher
//   const teacherPass = await bcrypt.hash('teach123', 10);
//   const teacher = await prisma.user.upsert({
//     where: { email: 'teacher@example.com' },
//     update: {},
//     create: {
//       name:     'Tutor Ms. Romlah',
//       email:    'teacher@example.com',
//       password: teacherPass,
//       role:     'TEACHER',
//     },
//   });

//   // 3) Create a Student
//   const studentPass = await bcrypt.hash('stud1234', 10);
//   const student = await prisma.user.upsert({
//     where: { email: 'student@example.com' },
//     update: {},
//     create: {
//       name:     'Student Joko',
//       email:    'student@example.com',
//       password: studentPass,
//       role:     'STUDENT',
//     },
//   });

//   // 4) Create a couple of Courses
//   const course1 = await prisma.course.upsert({
//     where: { id: 'Intro to Algebra' },
//     update: {},
//     create: {
//       title:       'Intro to Algebra',
//       description: 'Basic algebraic concepts, 1-on-1',
//       price:       100.0,
//       teacherId:   teacher.id
//     }
//   });
//   const course2 = await prisma.course.upsert({
//     where: { id: 'English Conversation' },
//     update: {},
//     create: {
//       title:       'English Conversation',
//       description: 'Practice speaking in everyday scenarios',
//       price:       120.0,
//       teacherId:   teacher.id
//     }
//   });

//   // 5) Create a sample Booking
//   await prisma.booking.upsert({
//     where: { id: '00000000-0000-0000-0000-000000000001' },
//     update: {},
//     create: {
//       id:          '00000000-0000-0000-0000-000000000001',
//       bookingDate: new Date(Date.now() + 7 * 24*60*60*1000), // a week from now
//       status:      'PENDING',
//       studentId:   student.id,
//       courseId:    course1.id
//     }
//   });

//   console.log('✅ Seed data created.');
// }

// main()
//   .catch(e => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
// prisma/seed.js
import pkg from '@prisma/client';
const { PrismaClient, ClassLevel, Curriculum } = pkg;
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1) USERS
  const passwordHash = await bcrypt.hash('secret123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: passwordHash,
      role: 'ADMIN',
    },
  });

  const teacher1 = await prisma.user.upsert({
    where: { email: 'teacher1@example.com' },
    update: {},
    create: {
      name: 'Teacher One',
      email: 'teacher1@example.com',
      password: passwordHash,
      role: 'TEACHER',
    },
  });

  const teacher2 = await prisma.user.upsert({
    where: { email: 'teacher2@example.com' },
    update: {},
    create: {
      name: 'Teacher Two',
      email: 'teacher2@example.com',
      password: passwordHash,
      role: 'TEACHER',
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      name: 'Student User',
      email: 'student@example.com',
      password: passwordHash,
      role: 'STUDENT',
    },
  });

  // 2) COURSES
  await prisma.course.createMany({
    skipDuplicates: true,
    data: [
      {
        id:         '11111111-aaaa-4444-bbbb-000000000001',
        title:      'Algebra 101',
        description:'Intro to basic algebra',
        price:      75.0,
        classLevel: 'GRADE10',
        curriculum: 'K13_REVISI',
        teacherId:  teacher1.id,
      },
      {
        id:         '11111111-aaaa-4444-bbbb-000000000002',
        title:      'History — Merdeka Curriculum',
        description:'…',
        price:      85.0,
        classLevel: 'GRADE11',
        curriculum: 'MERDEKA',
        teacherId:  teacher1.id,
      },
      {
        id:         '11111111-aaaa-4444-bbbb-000000000003',
        title:      'UTBK Mathematics Prep',
        description:'…',
        price:      120.0,
        classLevel: 'UTBK',
        curriculum: null,
        teacherId:  teacher2.id,
      },
    ]
  });

  // 3) SCHEDULES
  await prisma.schedule.createMany({
    data: [
      {
        courseId: "11111111-aaaa-4444-bbbb-000000000001",
        startTime: new Date('2025-06-01T08:00:00.000Z'),
        endTime:   new Date('2025-06-01T10:00:00.000Z'),
      },
      {
        courseId: "11111111-aaaa-4444-bbbb-000000000002",
        startTime: new Date('2025-06-02T13:00:00.000Z'),
        endTime:   new Date('2025-06-02T15:00:00.000Z'),
      },
      {
        courseId: "11111111-aaaa-4444-bbbb-000000000003",
        startTime: new Date('2025-06-03T09:00:00.000Z'),
        endTime:   new Date('2025-06-03T11:00:00.000Z'),
      },
    ]
  });

  console.log('🌱 Seed data created!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
