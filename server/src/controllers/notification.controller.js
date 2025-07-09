import * as notificationService from '../services/notification.service.js';
import asyncHandler from 'express-async-handler';

/**
 * Controller untuk mengambil notifikasi milik user yang login.
 * GET /api/notifications
 */
export const getMyNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getMyNotificationsService(req.user.id, req.query);
  res.status(200).json(result);
});

/**
 * Controller untuk menandai notifikasi sebagai telah dibaca.
 * POST /api/notifications/mark-as-read
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  const { type } = req.query;
  await notificationService.markAllAsReadService(req.user.id, type);
  res.status(204).send();
});