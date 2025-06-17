// server/routes/dashboardRoutes.js
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getDashboardStats } from '../controllers/dashboardController.js';
import catchAsync from '../utils/catchAsync.js';

const router = express.Router();

// Semua route di sini hanya untuk admin
router.use(authenticate, authorize('ADMIN'));

router.get('/stats', catchAsync(getDashboardStats));

export default router;