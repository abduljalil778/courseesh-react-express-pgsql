import prisma from '../../libs/prisma.js';

export default {
  findUnique: (args) => prisma.courseReview.findUnique(args),
  findMany: (args) => prisma.courseReview.findMany(args),
  create: (args) => prisma.courseReview.create(args),
  update: (args) => prisma.courseReview.update(args),
  delete: (args) => prisma.courseReview.delete(args),
  count: (args) => prisma.courseReview.count(args),
};