import prisma from '../../libs/prisma.js';

export default {
  findUnique: (args) => prisma.booking.findUnique(args),
  findMany: (args) => prisma.booking.findMany(args),
  create: (args) => prisma.booking.create(args),
  update: (args) => prisma.booking.update(args),
  delete: (args) => prisma.booking.delete(args),
  count: (args) => prisma.booking.count(args),
};