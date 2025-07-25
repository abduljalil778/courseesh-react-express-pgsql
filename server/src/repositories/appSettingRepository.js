import prisma from '../../libs/prisma.js';

export default {
  findUnique: (args) => prisma.applicationSetting.findUnique(args),
  findMany: (args) => prisma.applicationSetting.findMany(args),
  create: (args) => prisma.applicationSetting.create(args),
  update: (args) => prisma.applicationSetting.update(args),
  delete: (args) => prisma.applicationSetting.delete(args),
  count: (args) => prisma.applicationSetting.count(args),
};