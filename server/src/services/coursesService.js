import AppError from '../utils/AppError.mjs';
import CourseRepository from '../repositories/courseRepository.js';
import prisma from '../../libs/prisma.js';

// --- GET (Mengambil Data) ---

export const getAllCourses = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 10, sortBy = "createdAt", sortDir = "desc" } = req.query;
    const take = parseInt(limit);
    const skip = (parseInt(page) - 1) * take;

    const where = {};
    if (req.user?.role === 'TEACHER') {
      where.teacherId = req.user.id;
    }
    if (category) {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { teacher: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const total = await CourseRepository.count({ where });

    // Sorting dynamic
    const orderBy = {};
    if (sortBy === "price" || sortBy === "title" || sortBy === "createdAt") {
      orderBy[sortBy] = sortDir === "asc" ? "asc" : "desc";
    } else {
      orderBy.createdAt = "desc"; // fallback
    }

    const courses = await CourseRepository.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        classLevels: true,
        curriculum: true,
        learningObjectives: true,
        category: true,
        imageUrl: true,
        createdAt: true,
        teacherId: true,
        teacher: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          }
        },
        reviews: {
          select: {
            rating: true,
          }
        }
      },
      skip,
      take,
      orderBy,
    });

    // Aggregasi rating
    const coursesWithAggregates = courses.map(course => {
      const totalReviews = course.reviews.length;
      const sumOfRatings = course.reviews.reduce((acc, review) => acc + review.rating, 0);
      const averageRating = totalReviews > 0 ? sumOfRatings / totalReviews : 0;
      delete course.reviews;
      return {
        ...course,
        totalReviews,
        averageRating,
      };
    });

    // Kembalikan dengan total untuk frontend pagination
    return res.json({
      courses: coursesWithAggregates,
      total,
    });

  } catch (err) {
    next(new AppError(err.message, 500));
  }
};


export const getCourseById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const course = await CourseRepository.findUnique({
      where: { id },
      select: {
        id: true, title: true, description: true, price: true,
        teacherId: true,
        curriculum: true, classLevels: true, imageUrl: true,
        learningObjectives: true,
        teacher: { select: { id: true, name: true, email: true, avatarUrl: true } },
        reviews: { select: { rating: true } },
        category: true,
      }
    });
    
    const totalReviews = course.reviews.length;
    const sumOfRatings = course.reviews.reduce((acc, review) => acc + review.rating, 0);
    const averageRating = totalReviews > 0 ? sumOfRatings / totalReviews : 0;
    delete course.reviews;

    const courseWithAggregates = {
        ...course,
        totalReviews,
        averageRating
    };

    return res.json({data: courseWithAggregates});
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};


// --- POST (Membuat Data Baru) ---

export const createCourse = async (req, res, next) => {

  try {
    let { title, description, price, classLevels, curriculum, category, learningObjectives } = req.body;

    let parsedObjectives = [];
    if (learningObjectives && typeof learningObjectives === 'string') {
      try {
        parsedObjectives = JSON.parse(learningObjectives);
      } catch (e) {
        return next(new AppError('Invalid format for learning objectives.', 400));
      }
    }

    if (!title || !price || !classLevels) {
      return next(new AppError('Title, price, and class levels are required.', 400));
    }
    
    const parsedClassLevels = typeof classLevels === 'string' ? classLevels.split(',') : [];

    const data = {
      title,
      description: description || '',
      price: parseFloat(price),
      classLevels: parsedClassLevels,
      curriculum: curriculum || null,
      category: category || 'UMUM',
      teacherId: req.user.id,
      learningObjectives: parsedObjectives,
    };
    
    if (req.file) {
      data.imageUrl = `/uploads/${req.file.filename}`;
    }

    const course = await CourseRepository.create({ data });
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
    // Ambil semua field dari body
    const { title, description, price, classLevels, curriculum, category, learningObjectives } = req.body;

    // Pengecekan otorisasi (tidak berubah, sudah benar)
    const existing = await CourseRepository.findUnique({ where: { id } });
    if (!existing) return next(new AppError('Course not found', 404));
    if (req.user.role === 'TEACHER' && existing.teacherId !== req.user.id) {
      return next(new AppError('You are not authorized to update this course', 403));
    }

    // Siapkan objek untuk menampung data yang akan di-update
    const dataToUpdate = {};

    // Isi objek dataToUpdate hanya dengan field yang ada di request
    if (title) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (price) dataToUpdate.price = parseFloat(price);
    if (classLevels) dataToUpdate.classLevels = typeof classLevels === 'string' ? classLevels.split(',') : classLevels;
    if (curriculum !== undefined) dataToUpdate.curriculum = curriculum || null;
    if (category !== undefined) dataToUpdate.category = category;

    // --- LOGIKA PARSING DAN UPDATE YANG DIPERBAIKI ---
    // Cek jika learningObjectives ada di dalam request
    if (learningObjectives !== undefined) {
      let parsedObjectives = [];
      // Jika bentuknya string, coba parse. Jika sudah array, langsung gunakan.
      if (typeof learningObjectives === 'string' && learningObjectives) {
        try {
          parsedObjectives = JSON.parse(learningObjectives);
        } catch (e) {
          return next(new AppError('Invalid JSON format for learning objectives.', 400));
        }
      } else if (Array.isArray(learningObjectives)) {
        parsedObjectives = learningObjectives;
      }
      // Masukkan ke dataToUpdate dengan nama field yang benar
      dataToUpdate.learningObjectives = parsedObjectives;
    }

    // Handle file upload (tidak berubah)
    if (req.file) {
      dataToUpdate.imageUrl = `/uploads/${req.file.filename}`;
    }

    // Lakukan update ke database
    const updated = await CourseRepository.update({
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
    const existing = await CourseRepository.findUnique({ where: { id } });
    if (!existing) {
      return next(new AppError(`Course with id=${id} not found`, 404));
    }
    if (req.user.role === 'TEACHER' && existing.teacherId !== req.user.id) {
      return next(new AppError('Cannot delete a course you do not own', 403));
    }
    await CourseRepository.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};