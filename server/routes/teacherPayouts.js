//server/routes/teacherPayouts.js
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
    getAllTeacherPayouts,
    getTeacherPayoutById,
    updateTeacherPayout,
} from '../controllers/teacherPayoutController.js';
import catchAsync from '../utils/catchAsync.js';
import { 
    payoutIdParamValidator, 
    updatePayoutStatusValidator,
    listPayoutsQueryValidator,
} from '../validators/teacherPayoutValidators.js';
import {runValidation} from '../middleware/validate.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'))

// List all teacher payouts
router.get(
    '/teacher-payouts',
    listPayoutsQueryValidator,
    runValidation,
    catchAsync(getAllTeacherPayouts)
);

// get teacher payout by id
router.get(
    '/teacher-payouts/:payoutId',
    payoutIdParamValidator,
    runValidation,
    catchAsync(getTeacherPayoutById)
)

// Update teacher payout
router.put(
    '/teacher-payouts/:payoutId',
    payoutIdParamValidator,
    updatePayoutStatusValidator,
    runValidation,
    catchAsync(updateTeacherPayout)
)

export default router