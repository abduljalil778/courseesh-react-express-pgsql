import prisma from '../../libs/prisma.js';

export default {
  findUnique: (args) => prisma.teacherPayout.findUnique(args),
  findMany: (args) => prisma.teacherPayout.findMany(args),
  create: (args) => prisma.teacherPayout.create(args),
  update: (args) => prisma.teacherPayout.update(args),
  delete: (args) => prisma.teacherPayout.delete(args),
  count: (args) => prisma.teacherPayout.count(args),
};