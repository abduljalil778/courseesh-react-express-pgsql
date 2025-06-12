import {PrismaClient} from '@prisma/client';
import AppError from '../utils/AppError.mjs';

const prisma = new PrismaClient();

// --- GET (Mengambil Data) ---

export const getAllCourses = async (req, res, next) => {
  try {
    const where = {};
    if (req.user?.role === 'TEACHER') {
      where.teacherId = req.user.id;
    }

    const courses = await prisma.course.findMany({
      where,
      select: { 
        id: true, title: true, description: true, price: true,
        numberOfSessions: true, classLevels: true, curriculum: true, imageUrl: true,
        teacher: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const courseIds = courses.map(c => c.id);
    if (courseIds.length === 0) {
        return res.json([]);
    }

    const averageRatings = await prisma.courseReview.groupBy({
      by: ['courseId'],
      where: { courseId: { in: courseIds } },
      _avg: { rating: true },
    });
    
    const coursesWithRatings = courses.map(course => {
      const ratingData = averageRatings.find(r => r.courseId === course.id);
      return {
        ...course,
        averageRating: ratingData?._avg.rating || 0,
        totalReviews: course._count.reviews,
      };
    });

    return res.json(coursesWithRatings);
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

export const getCourseById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const course = await prisma.course.findUnique({
      where: { id },
      select: {
        id: true, title: true, description: true, price: true,
        numberOfSessions: true, curriculum: true, classLevels: true, imageUrl: true,
        teacher: { select: { id: true, name: true, email: true, avatarUrl: true } }
      }
    });
    if (!course) {
      return next(new AppError(`Course with id=${id} not found`, 404));
    }
    return res.json(course);
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

// --- POST (Membuat Data Baru) ---

export const createCourse = async (req, res, next) => {

  try {
    const { title, description, price, numberOfSessions, classLevels, curriculum } = req.body;

    if (!title || !price || !numberOfSessions || !classLevels) {
      return next(new AppError('Title, price, sessions, and class levels are required.', 400));
    }
    
    const parsedClassLevels = typeof classLevels === 'string' ? classLevels.split(',') : [];

    const data = {
      title,
      description: description || '',
      price: parseFloat(price),
      numberOfSessions: parseInt(numberOfSessions, 10),
      classLevels: parsedClassLevels,
      curriculum: curriculum || null,
      teacherId: req.user.id,
    };
    
    if (req.file) {
      data.imageUrl = `/uploads/${req.file.filename}`;
    }

    const course = await prisma.course.create({ data });
    return res.status(201).json(course);
    
  } catch (error) {
    return next(new AppError(error.message, 500));
    
  }

  
};

export const updateCourse = async (req, res, next) => {
  try {
    if (!req.body && !req.file) {
      return next(new AppError('No data received', 400));
    }

    const { id } = req.params;
    const { title, description, price, numberOfSessions, classLevels, curriculum } = req.body;

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) return next(new AppError('Course not found', 404));
    if (req.user.role === 'TEACHER' && existing.teacherId !== req.user.id) {
      return next(new AppError('You are not authorized to update this course', 403));
    }

    const dataToUpdate = {};
    if (title) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (price) dataToUpdate.price = parseFloat(price);
    if (numberOfSessions) dataToUpdate.numberOfSessions = parseInt(numberOfSessions, 10);
    if (classLevels) dataToUpdate.classLevels = typeof classLevels === 'string' ? classLevels.split(',') : classLevels;
    if (curriculum !== undefined) dataToUpdate.curriculum = curriculum || null;

    if (req.file) {
      dataToUpdate.imageUrl = `/uploads/${req.file.filename}`;
    }

    const updated = await prisma.course.update({
      where: { id },
      data: dataToUpdate,
    });
    return res.json(updated);
    
  } catch (error) {
    return next(new AppError(error.message, 500));
    
  }
  
};

// --- DELETE ---

export const deleteCourse = async (req, res, next) => {
  const { id } = req.params;
  try {
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      return next(new AppError(`Course with id=${id} not found`, 404));
    }
    if (req.user.role === 'TEACHER' && existing.teacherId !== req.user.id) {
      return next(new AppError('Cannot delete a course you do not own', 403));
    }
    await prisma.course.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};