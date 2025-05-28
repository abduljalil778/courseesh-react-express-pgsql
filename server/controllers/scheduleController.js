import pkg from '@prisma/client';
import catchAsync from '../utils/catchAsync.js';
import AppError   from '../utils/appError.js';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// Teachers list/create schedules for their own courses:
export const getSchedules = catchAsync(async (req, res) => {
  let where = {};
  if (req.user.role === 'TEACHER') {
    where.course = { teacherId: req.user.id };
  }
  const schedules = await prisma.schedule.findMany({
    where,
    include: { course: { select: { id: true, title: true } } }
  });
  res.json(schedules);
});

export const createSchedule = catchAsync(async (req, res) => {
  if (req.user.role !== 'TEACHER') {
    throw new AppError('Only teachers may add slots', 403);
  }
  const { courseId, startTime, endTime } = req.body;
  // ensure teacher owns that course
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.teacherId !== req.user.id) {
    throw new AppError('Not your course', 403);
  }
  const slot = await prisma.schedule.create({
    data: { courseId, startTime: new Date(startTime), endTime: new Date(endTime) }
  });
  res.status(201).json(slot);
});

export const updateSchedule = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updates = {};
  ['startTime','endTime'].forEach(f => {
    if (req.body[f]) updates[f] = new Date(req.body[f]);
  });
  const sched = await prisma.schedule.update({
    where: { id },
    data: updates
  });
  res.json(sched);
});

export const deleteSchedule = catchAsync(async (req, res) => {
  await prisma.schedule.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
