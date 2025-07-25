import AppError from '../utils/AppError.mjs';
import CourseRepository from '../repositories/courseRepository.js';

/**
 * Service untuk mengambil semua kursus dengan filter, paginasi, dan sorting.
 * @param {object} filters - Opsi filter: { category, search, page, limit, sortBy, sortDir }.
 * @param {object} user - Objek user yang sedang login (untuk filter berdasarkan guru).
 * @returns {Promise<{courses: Array, total: number}>}
 */
export async function getAllCoursesService(filters = {}, user = null) {
    const { category, classLevel, search, page = 1, limit = 10, sortBy = "createdAt", sortDir = "desc" } = filters;
    const take = parseInt(limit);
    const skip = (parseInt(page) - 1) * take;

    const where = {};
    // Jika user adalah guru, hanya tampilkan kursus miliknya
    if (user?.role === 'TEACHER') {
      where.teacherId = user.id;
    }
    if (category) {
      where.categoryId = category;
    }
    if (classLevel) {
      where.classLevels = {
        has: classLevel
      }
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { teacher: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const total = await CourseRepository.count({ where });

    const orderBy = {};
    if (["price", "title", "createdAt"].includes(sortBy)) {
      orderBy[sortBy] = sortDir === "asc" ? "asc" : "desc";
    } else {
      orderBy.createdAt = "desc"; // Fallback
    }

    const courses = await CourseRepository.findMany({
      where,
      select: {
        id: true, title: true, description: true, price: true,
        classLevels: true, curriculum: true, learningObjectives: true,
        imageUrl: true, createdAt: true, teacherId: true,
        category: true,
        teacher: { select: { id: true, name: true, avatarUrl: true } },
        reviews: { select: { rating: true } }
      },
      skip,
      take,
      orderBy,
    });

    // Agregasi rating dilakukan di sini, di dalam service layer
    const coursesWithAggregates = courses.map(course => {
      const totalReviews = course.reviews.length;
      const sumOfRatings = course.reviews.reduce((acc, review) => acc + review.rating, 0);
      const averageRating = totalReviews > 0 ? sumOfRatings / totalReviews : 0;
      delete course.reviews;
      return { ...course, totalReviews, averageRating };
    });

    return { courses: coursesWithAggregates, total };
}

/**
 * Service untuk mengambil satu kursus berdasarkan ID.
 * @param {string} courseId - ID dari kursus.
 * @returns {Promise<object>}
 */
export async function getCourseByIdService(courseId) {
  const course = await CourseRepository.findUnique({
    where: { id: courseId },
    select: {
      id: true, title: true, description: true, price: true, teacherId: true,
      curriculum: true, classLevels: true, imageUrl: true, learningObjectives: true,
      teacher: { select: { id: true, name: true, email: true, avatarUrl: true } },
      reviews: { select: { rating: true } },
      category: true,
    }
  });

  if (!course) {
    throw new AppError('Course not found', 404);
  }

  // Agregasi rating
  const totalReviews = course.reviews.length;
  const sumOfRatings = course.reviews.reduce((acc, review) => acc + review.rating, 0);
  const averageRating = totalReviews > 0 ? sumOfRatings / totalReviews : 0;
  delete course.reviews;

  return { ...course, totalReviews, averageRating };
}

/**
 * Service untuk membuat kursus baru.
 * @param {object} courseData - Data untuk kursus baru.
 * @param {object} user - User yang membuat kursus (guru).
 * @param {object} file - File thumbnail yang diunggah (dari multer).
 * @returns {Promise<object>}
 */
export async function createCourseService(courseData, user, file) {
    let { title, description, price, classLevels, curriculum, categoryId, learningObjectives } = courseData;

    if (!title || !price || !classLevels) {
      throw new AppError('Title, price, and class levels are required.', 400);
    }
    
    // Parsing data dari form-data yang mungkin berupa string
    let parsedObjectives = [];
    if (learningObjectives && typeof learningObjectives === 'string') {
        try {
            parsedObjectives = JSON.parse(learningObjectives);
        } catch (e) {
            throw new AppError('Invalid JSON format for learning objectives.', 400);
        }
    } else if (Array.isArray(learningObjectives)) {
        parsedObjectives = learningObjectives;
    }
    
    const parsedClassLevels = typeof classLevels === 'string' ? classLevels.split(',') : classLevels;

    const data = {
      title,
      description: description || '',
      price: parseFloat(price),
      classLevels: parsedClassLevels,
      curriculum: curriculum || null,
      categoryId: categoryId,
      teacherId: user.id,
      learningObjectives: parsedObjectives,
    };
    
    if (file) {
      data.imageUrl = `/uploads/${file.filename}`;
    }

    return await CourseRepository.create({ data });
}

/**
 * Service untuk memperbarui kursus.
 * @param {string} courseId - ID kursus yang akan diperbarui.
 * @param {object} dataToUpdate - Data yang akan diperbarui.
 * @param {object} user - User yang melakukan request (untuk otorisasi).
 * @param {object} file - File baru yang diunggah (jika ada).
 * @returns {Promise<object>}
 */
export async function updateCourseService(courseId, dataToUpdate, user, file) {
    const existingCourse = await CourseRepository.findUnique({ where: { id: courseId } });
    if (!existingCourse) {
        throw new AppError('Course not found', 404);
    }
    
    if (user.role === 'TEACHER' && existingCourse.teacherId !== user.id) {
        throw new AppError('You are not authorized to update this course', 403);
    }

    // Proses data yang mungkin datang sebagai string dari FormData
    if (dataToUpdate.price) dataToUpdate.price = parseFloat(dataToUpdate.price);
    if (dataToUpdate.classLevels && typeof dataToUpdate.classLevels === 'string') {
        dataToUpdate.classLevels = dataToUpdate.classLevels.split(',');
    }
    if (dataToUpdate.learningObjectives && typeof dataToUpdate.learningObjectives === 'string') {
        try {
            dataToUpdate.learningObjectives = JSON.parse(dataToUpdate.learningObjectives);
        } catch (e) {
            throw new AppError('Invalid JSON format for learning objectives.', 400);
        }
    }
    
    // Pastikan field `category` yang lama tidak digunakan
  if (dataToUpdate.category) {
      delete dataToUpdate.category;
  }

    if (file) {
        dataToUpdate.imageUrl = `/uploads/${file.filename}`;
    }

    return await CourseRepository.update({
      where: { id: courseId },
      data: dataToUpdate,
    });
}

/**
 * Service untuk menghapus kursus.
 * @param {string} courseId - ID kursus yang akan dihapus.
 * @param {object} user - User yang melakukan request (untuk otorisasi).
 * @returns {Promise<void>}
 */
export async function deleteCourseService(courseId, user) {
    const existingCourse = await CourseRepository.findUnique({ where: { id: courseId } });
    if (!existingCourse) {
        throw new AppError(`Course with id=${courseId} not found`, 404);
    }
    if (user.role === 'TEACHER' && existingCourse.teacherId !== user.id) {
        throw new AppError('Cannot delete a course you do not own', 403);
    }
    await CourseRepository.delete({ where: { id: courseId } });
}