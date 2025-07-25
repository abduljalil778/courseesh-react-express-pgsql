
import { ClassLevel, Curriculum } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../libs/prisma.js';

async function main() {

  const defaultServiceFee = await prisma.applicationSetting.upsert({
    where: { key: 'DEFAULT_SERVICE_FEE_PERCENTAGE' },
    update: {}, // Jangan ubah jika sudah ada
    create: {
      key: 'DEFAULT_SERVICE_FEE_PERCENTAGE',
      value: '0.15', // Nilai default 15%
      description: 'Default service fee percentage charged by the application from teacher revenue per session.',
      dataType: 'NUMBER',
    },
  });

  console.log(`✅ Default setting created/ensured: ${defaultServiceFee.key}`);

  const categories = [
    { name: 'Matematika' },
    { name: 'Bahasa Inggris' },
    { name: 'Bahasa Indonesia' },
    { name: 'Fisika' },
    { name: 'Kimia' },
    { name: 'Biologi' },
    { name: 'Sosiologi' },
    { name: 'Ekonomi' },
    { name: 'Geografi' },
    { name: 'IPA' },
    { name: 'IPS' },
    { name: 'Umum' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name },
    });
  }
  console.log('✅ Categories seeded.');

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

