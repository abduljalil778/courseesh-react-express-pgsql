// server/routes/dashboardRoutes.js
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import asyncHandler from 'express-async-handler';

const router = express.Router();

// Semua route di sini hanya untuk admin
router.use(authenticate, authorize('ADMIN'));

router.get('/stats', asyncHandler(getDashboardStats));

export default router;