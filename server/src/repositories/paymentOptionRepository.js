import prisma from '../../libs/prisma.js';

export default {
  findUnique: (args) => prisma.paymentOption.findUnique(args),
  findMany: (args) => prisma.paymentOption.findMany(args),
  create: (args) => prisma.paymentOption.create(args),
  update: (args) => prisma.paymentOption.update(args),
  delete: (args) => prisma.paymentOption.delete(args),
  count: (args) => prisma.paymentOption.count(args),
};