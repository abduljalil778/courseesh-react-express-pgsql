import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import catchAsync from '../utils/catchAsync.js';
import { getMyConversations, getMessagesByBookingId } from '../controllers/chat.controller.js';


const router = express.Router();


router.use(authenticate)

router.get(
  '/:bookingId/message',
  catchAsync(getMessagesByBookingId)
)

router.get(
    '/my',
    catchAsync(getMyConversations)
)

export default router;