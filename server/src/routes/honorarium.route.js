import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getPendingHonorariums, processPayouts } from '../controllers/honorarium.controller.js';
import asyncHandler from 'express-async-handler';

const router = express.Router();
router.use(authenticate, authorize('ADMIN', 'FINANCE'));

router.get('/pending', asyncHandler(getPendingHonorariums));
router.post('/process', asyncHandler(processPayouts));

export default router;