import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

/**
 * GET /api/courses
 * Public: list all courses, include teacher info
 */
export const getAllCourses = async (req, res) => {
  try {
    const where = {};

    // match with teacher id when return courses
    if (req.user.role === 'TEACHER') {
      where.teacherId = req.user.id;
    }

    const courses = await prisma.course.findMany({
      where,
      include: { teacher: { select: { id: true, name: true, email: true } } }
    });
    return res.json(courses);
  } catch (err) {
    console.error('getAllCourses:', err);
    return res.status(500).json({ message: 'Server error fetching courses' });
  }
};

/**
 * GET /api/courses/:id
 * Public: get one course by ID
 */
export const getCourseById = async (req, res) => {
  const { id } = req.params;
  try {
    const course = await prisma.course.findUnique({
      where: { id },
      select: {
      id: true,
      title: true,
      description: true,
      price: true,
      numberOfSessions: true,
      curriculum: true,
      classLevel: true,
      teacher: {
        select: { id: true, name: true, email: true }
      }
    }
    });
    if (!course) {
      return res.status(404).json({ message: `Course with id=${id} not found` });
    }
    return res.json(course);
  } catch (err) {
    console.error('getCourseById:', err);
    return res.status(500).json({ message: 'Server error fetching course' });
  }
};

/**
 * POST /api/courses
 * Protected: TEACHER or ADMIN
 * Body: { title, description, price }
 */
export const createCourse = async (req, res) => {
  const { title, description, price, classLevel, curriculum, numberOfSessions } = req.body;
  if (![title, description, price, classLevel, numberOfSessions].every(v => v !== undefined)) {
    return next(new AppError('Missing required fields', 400));
  }

  try {
    const course = await prisma.course.create({
    data: {
      title,
      description,
      price,
      classLevel,
      curriculum,              // optional
      numberOfSessions,
      teacherId: req.user.id,  // assuming you’re auth’ing the teacher
    },
  });
    return res.status(201).json(course);
  } catch (err) {
    console.error('createCourse:', err);
    return res.status(500).json({ message: 'Server error creating course' });
  }
};

/**
 * PUT /api/courses/:id
 * Protected: TEACHER or ADMIN (and teacher must own the course if TEACHER)
 * Body: { title?, description?, price? }
 */
export const updateCourse = async (req, res, next) => {
  const { id } = req.params;
  const updates = {};
  ['title', 'description', 'price'].forEach(field => {
    if (req.body[field] != null) updates[field] = field === 'price'
      ? parseFloat(req.body[field])
      : req.body[field];
  });

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'Nothing to update' });
  }

  try {
    // ensure teacher owns it if role=TEACHER
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: `Course with id=${id} not found` });
    }
    if (req.user.role === 'TEACHER' && existing.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Cannot modify a course you do not own' });
    }

    const updated = await prisma.course.update({
      where: { id },
      data: updates
    });
    return res.json(updated);
  } catch (err) {
    console.error('updateCourse:', err);
    return res.status(500).json({ message: 'Server error updating course' });
  }
};

/**
 * DELETE /api/courses/:id
 * Protected: TEACHER or ADMIN
 */
export const deleteCourse = async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: `Course with id=${id} not found` });
    }
    if (req.user.role === 'TEACHER' && existing.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Cannot delete a course you do not own' });
    }
    await prisma.course.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    console.error('deleteCourse:', err);
    return res.status(500).json({ message: 'Server error deleting course' });
  }
};
