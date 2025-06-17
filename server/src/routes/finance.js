import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getFinanceRecap } from '../controllers/financeController.js';
import { getDashboardStats } from '../controllers/dashboardController.js';
import catchAsync from '../utils/catchAsync.js';

const router = express.Router();

router.use(authenticate, authorize('FINANCE'));

router.get('/stats', catchAsync(getDashboardStats));
router.get('/recap', catchAsync(getFinanceRecap));

export default router;