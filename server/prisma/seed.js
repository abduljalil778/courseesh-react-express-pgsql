import pkg from '@prisma/client';
const { PrismaClient, ClassLevel, Curriculum } = pkg;
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1) USERS
  const passwordHash = await bcrypt.hash('secret', 10);

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


// async function main() {
//   console.log(`Start seeding ...`);

  // // Buat atau update setting DEFAULT_SERVICE_FEE_PERCENTAGE
  // const defaultServiceFee = await prisma.applicationSetting.upsert({
  //   where: { key: 'DEFAULT_SERVICE_FEE_PERCENTAGE' }, // `key` harus @unique di skema Anda
  //   update: {}, // Tidak ada yang diupdate jika sudah ada, biarkan nilai yang ada
  //   create: {
  //     key: 'DEFAULT_SERVICE_FEE_PERCENTAGE',
  //     value: '0.15', // Nilai default 15%
  //     description: 'Default service fee percentage charged by the application.',
  //     dataType: 'NUMBER', // Atau 'FLOAT' jika Anda ingin lebih spesifik, meskipun value tetap string
  //   },
  // });
  // console.log(`Created/ensured setting: ${defaultServiceFee.key} with value ${defaultServiceFee.value}`);

//   console.log(`Seeding finished.`);
// }

// main()
//   .catch(async (e) => {
//     console.error(e);
//     await prisma.$disconnect();
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });