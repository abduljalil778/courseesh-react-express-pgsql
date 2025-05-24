// server/controllers/usersController.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
import bcrypt from 'bcryptjs';

// GET /api/users
export const getAllUsers = async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true
    }
  });
  res.json(users);
};

// GET /api/users/:id
export const getUserById = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: {
      id: req.params.id
    }, select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true
    }
  });
  if (!user) {
    return res.status(404).json(({message: 'User not found'}))
  }
}

// POST /api/users
export const createUser = async (req, res) => {
  const {name, email, password, role} = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role,
    }
  });
  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  })
}

// PUT /api/users/:id
export const updateUser = async (req, res) => {
  try {
    // 1️⃣ Pull the ID and the fields out of the request
    const userId = req.params.id;
    const { name, email, role, status } = req.body;

    // 2️⃣ Build a “data” object that only contains the fields you actually sent
    const data = {};
    if (name   != null) data.name   = name;
    if (email  != null) data.email  = email;
    if (role   != null) data.role   = role;
    if (status != null) data.status = status;

    // 3️⃣ If the admin submitted no fields at all, bail out
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    // 4️⃣ Perform the update
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id:true, name:true, email:true, role:true, status:true }
    });

    return res.json(user);
  } catch (err) {
    // 5️⃣ Catch duplicate-email errors (optional)
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002' &&
      err.meta?.target?.includes('email')
    ) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    // Otherwise, let your global error handler deal with it
    return next(err);
  }
}

// DELETE /api/users/:id
export const deleteUser = async (req, res) => {
  await prisma.user.delete({
    where: {
      id: req.params.id
    }
  })
  res.status(204).send()
}