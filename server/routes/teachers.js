//src/routes/teachers.js
import express from 'express';
import {authenticate,authorize} from '../middleware/auth.js';
import {getMyPayouts} from '../controllers/teachersController.js';
import catchAsync from '../utils/catchAsync.js';

const router = express.Router();

router.use(authenticate);

router.get(
    '/my-payouts',
    authorize('TEACHER'),
    catchAsync(getMyPayouts)
);

export default router