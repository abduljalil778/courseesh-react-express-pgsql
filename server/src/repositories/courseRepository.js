import prisma from '../../libs/prisma.js';

export default {
  findUnique: (args) => prisma.course.findUnique(args),
  findMany: (args) => prisma.course.findMany(args),
  create: (args) => prisma.course.create(args),
  update: (args) => prisma.course.update(args),
  delete: (args) => prisma.course.delete(args),
  count: (args) => prisma.course.count(args),
};