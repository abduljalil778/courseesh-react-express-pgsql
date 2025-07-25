import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getFinanceRecap } from '../controllers/finance.controller.js';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import asyncHandler from 'express-async-handler';

const router = express.Router();

router.use(authenticate, authorize('FINANCE'));

router.get('/stats', asyncHandler(getDashboardStats));
router.get('/recap', asyncHandler(getFinanceRecap));

export default router;