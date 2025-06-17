import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getAllUsers, createUser, getUserById, updateUser, deleteUser, uploadAvatar, updateMyPayoutInfo } from '../controllers/usersController.js';
import { createUserValidator, updateUserValidator, userIdValidator, updatePayoutInfoValidator } from '../validators/usersValidator.js';
import { runValidation } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// get all users
router.get('/',
  authenticate,
  authorize('ADMIN'),
  getAllUsers
);

// get user by id
router.get('/:id', 
  userIdValidator,
  runValidation,
  getUserById
)

// create user
router.post('/',
  authenticate,
  authorize('ADMIN'),
  createUserValidator,
  runValidation,
  createUser
)

// delete user
router.delete('/:id',
  authenticate,
  authorize('ADMIN'),
  userIdValidator,
  runValidation,
  deleteUser
)

// update user
router.put('/:id',
  userIdValidator,
  updateUserValidator,
  runValidation,
  updateUser
)

router.post(
  '/me/upload-avatar',
  authenticate,
  upload.single('avatar'),
  uploadAvatar
);

router.put(
    '/me/payout-info',
    authenticate,
    authorize('TEACHER'),
    updatePayoutInfoValidator,
    runValidation,
    updateMyPayoutInfo
)

export default router;
