import express from 'express';
import {authenticate,authorize} from '../middleware/auth.js';
import {getMyPayouts,} from '../controllers/teachers.controller.js';
import asyncHandler from 'express-async-handler';
import { getTeacherPublicProfile } from '../controllers/users.controller.js';

const router = express.Router();


router.get(
    '/my-payouts',
    authenticate,
    authorize('TEACHER'),
    asyncHandler(getMyPayouts)
);

router.get(
    '/:teacherId/profile',
    asyncHandler(getTeacherPublicProfile)
)

export default router