import prisma from '../../libs/prisma.js';

export default {
  findUnique: (args) => prisma.bookingSession.findUnique(args),
  findMany: (args) => prisma.bookingSession.findMany(args),
  create: (args) => prisma.bookingSession.create(args),
  update: (args) => prisma.bookingSession.update(args),
  delete: (args) => prisma.bookingSession.delete(args),
  count: (args) => prisma.bookingSession.count(args),
};