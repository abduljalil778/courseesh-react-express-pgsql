import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import asyncHandler from 'express-async-handler';
import { getMyConversations, getMessagesByConversationId, markConversationAsRead } from '../controllers/chat.controller.js';


const router = express.Router();


router.use(authenticate)

// router.get(
//   '/:bookingId/message',
//   catchAsync(getMessagesByBookingId)
// )

router.get('/:conversationId/message', asyncHandler(getMessagesByConversationId))

router.get('/my', asyncHandler(getMyConversations))

router.post('/:conversationId/mark-as-read', asyncHandler(markConversationAsRead))

export default router;