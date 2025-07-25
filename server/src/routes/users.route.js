import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getAllUsers, createUser, getUserById, updateUser, deleteUser, uploadAvatar, updateMyPayoutInfo, changePassword, getMyProfile } from '../controllers/users.controller.js';
import { createUserValidator, updateUserValidator, userIdValidator, updatePayoutInfoValidator } from '../validators/usersValidator.js';
import { runValidation } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import asyncHandler from 'express-async-handler';

const router = express.Router();

router.get(
  '/me/',
  authenticate,
  asyncHandler(getMyProfile)
)

// get all users
router.get('/',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(getAllUsers)
);

// get user by id
router.get('/:id', 
  userIdValidator,
  runValidation,
  asyncHandler(getUserById)
)

// create user
router.post('/',
  authenticate,
  authorize('ADMIN'),
  createUserValidator,
  runValidation,
  asyncHandler(createUser)
)

// delete user
router.delete('/:id',
  authenticate,
  authorize('ADMIN'),
  userIdValidator,
  runValidation,
  asyncHandler(deleteUser)
)

// update user
router.put('/:id',
  authenticate,
  userIdValidator,
  updateUserValidator,
  runValidation,
  asyncHandler(updateUser)
)

router.post(
  '/me/upload-avatar',
  authenticate,
  upload.single('avatar'),
  asyncHandler(uploadAvatar)
);

router.put(
    '/me/payout-info',
    authenticate,
    authorize('TEACHER'),
    updatePayoutInfoValidator,
    runValidation,
    asyncHandler(updateMyPayoutInfo)
)



router.put(
  '/me/change-password',
  authenticate,
  asyncHandler(changePassword)
)

export default router;
