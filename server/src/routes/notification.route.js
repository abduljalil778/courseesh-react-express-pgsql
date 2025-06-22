import { getMyNotifications, markAllAsRead } from '../controllers/notification.controller.js';

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import catchAsync from '../utils/catchAsync.js';

const router = express.Router()

router.get(
    '/',
    authenticate,
    catchAsync(getMyNotifications)
)

router.post(
    '/mark-as-read',
    authenticate,
    catchAsync(markAllAsRead)
)

export default router;