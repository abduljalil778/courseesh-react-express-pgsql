import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getAllUsers, createUser, getUserById, updateUser, deleteUser, uploadAvatar, updateMyPayoutInfo, changePassword, getMyProfile } from '../controllers/usersController.js';
import { createUserValidator, updateUserValidator, userIdValidator, updatePayoutInfoValidator } from '../validators/usersValidator.js';
import { runValidation } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import catchAsync from '../utils/catchAsync.js';

const router = express.Router();

router.get(
  '/me/',
  authenticate,
  catchAsync(getMyProfile)
)

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
  authenticate,
  userIdValidator,
  updateUserValidator,
  runValidation,
  catchAsync(updateUser)
)

router.post(
  '/me/upload-avatar',
  authenticate,
  upload.single('avatar'),
  catchAsync(uploadAvatar)
);

router.put(
    '/me/payout-info',
    authenticate,
    authorize('TEACHER'),
    updatePayoutInfoValidator,
    runValidation,
    catchAsync(updateMyPayoutInfo)
)



router.put(
  '/me/change-password',
  authenticate,
  catchAsync(changePassword)
)

export default router;
