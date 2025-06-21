//src/routes/teachers.js
import express from 'express';
import {authenticate,authorize} from '../middleware/auth.js';
import {getMyPayouts,} from '../controllers/teachersController.js';
import catchAsync from '../utils/catchAsync.js';
import { getTeacherPublicProfile } from '../controllers/usersController.js';

const router = express.Router();


router.get(
    '/my-payouts',
    authenticate,
    authorize('TEACHER'),
    catchAsync(getMyPayouts)
);

router.get(
    '/:teacherId/profile',
    catchAsync(getTeacherPublicProfile)
)

export default router