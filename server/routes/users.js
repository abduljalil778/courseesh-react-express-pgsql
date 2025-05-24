// server/routes/users.js
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import catchAsync from '../utils/catchAsync.js';
import { getAllUsers, createUser, getUserById, updateUser, deleteUser } from '../controllers/usersController.js';
import { createUserValidator, updateUserValidator, userIdValidator } from '../validators/usersValidator.js';
import { runValidation } from '../middleware/validate.js';

const router = express.Router();

// get all users
router.get('/',
  authenticate,
  authorize('ADMIN'),
  catchAsync(getAllUsers)
);

// get user by id
router.get('/:id', 
  userIdValidator,
  runValidation,
  catchAsync(getUserById)
)

// create user
router.post('/',
  authenticate,
  authorize('ADMIN'),
  createUserValidator,
  runValidation,
  catchAsync(createUser)
)

// delete user
router.delete('/:id',
  authenticate,
  authorize('ADMIN'),
  userIdValidator,
  runValidation,
  catchAsync(deleteUser)
)

// update user
router.put('/:id',
  userIdValidator,
  updateUserValidator,
  runValidation,
  catchAsync(updateUser)
)

export default router;
