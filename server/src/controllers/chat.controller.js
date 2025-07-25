import * as chatService from '../services/chat.service.js';
import asyncHandler from 'express-async-handler';

/**
 * Controller untuk mengambil semua percakapan milik user yang login.
 * GET /api/conversations/my
 */
export const getMyConversations = asyncHandler(async (req, res) => {
  const conversations = await chatService.getMyConversationsService(req.user);
  res.status(200).json({ data: conversations });
});

/**
 * Controller untuk mengambil semua pesan dari sebuah percakapan.
 * GET /api/conversations/:conversationId/message
 */
export const getMessagesByConversationId = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const messages = await chatService.getMessagesByConversationIdService(conversationId, req.user);
  res.status(200).json({ data: messages });
});

/**
 * Controller untuk menandai percakapan sebagai telah dibaca.
 * POST /api/conversations/:conversationId/mark-as-read
 */
export const markConversationAsRead = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  await chatService.markConversationAsReadService(conversationId, req.user);
  res.status(204).send();
});