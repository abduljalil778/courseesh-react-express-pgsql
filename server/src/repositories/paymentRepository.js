import prisma from '../../libs/prisma.js';

export default {
  findUnique: (args) => prisma.payment.findUnique(args),
  findMany: (args) => prisma.payment.findMany(args),
  create: (args) => prisma.payment.create(args),
  update: (args) => prisma.payment.update(args),
  delete: (args) => prisma.payment.delete(args),
  count: (args) => prisma.payment.count(args),
};