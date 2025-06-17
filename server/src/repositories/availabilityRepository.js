import prisma from '../../libs/prisma.js';

export default {
  findUnique: (args) => prisma.teacherUnavailableDate.findUnique(args),
  findMany: (args) => prisma.teacherUnavailableDate.findMany(args),
  create: (args) => prisma.teacherUnavailableDate.create(args),
  update: (args) => prisma.teacherUnavailableDate.update(args),
  delete: (args) => prisma.teacherUnavailableDate.delete(args),
  count: (args) => prisma.teacherUnavailableDate.count(args),
};