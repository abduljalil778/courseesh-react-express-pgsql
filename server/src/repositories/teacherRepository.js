import prisma from '../../libs/prisma.js';

export default {
  findUnique: (args) => prisma.user.findUnique(args),
  findMany: (args) => prisma.user.findMany(args),
  create: (args) => prisma.user.create(args),
  update: (args) => prisma.user.update(args),
  delete: (args) => prisma.user.delete(args),
  count: (args) => prisma.user.count(args),
};