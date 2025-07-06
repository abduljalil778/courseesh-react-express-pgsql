import { getMyNotifications, markAllAsRead } from '../controllers/notification.controller.js';

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import asyncHandler from 'express-async-handler';

const router = express.Router()

router.get(
    '/',
    authenticate,
    asyncHandler(getMyNotifications)
)

router.post(
    '/mark-as-read',
    authenticate,
    asyncHandler(markAllAsRead)
)

export default router;