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
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

// List all teacher payouts
router.get(
    '/teacher-payouts',
    authorize('ADMIN'),
    listPayoutsQueryValidator,
    runValidation,
    catchAsync(getAllTeacherPayouts)
);

// get teacher payout by id
router.get(
    '/teacher-payouts/:payoutId',
    authorize('ADMIN'),
    payoutIdParamValidator,
    runValidation,
    catchAsync(getTeacherPayoutById)
)

// Update teacher payout
router.put(
    '/teacher-payouts/:payoutId',
    authorize('ADMIN'),
    upload.single('adminProof'),
    payoutIdParamValidator,
    updatePayoutStatusValidator,
    runValidation,
    catchAsync(updateTeacherPayout)
)

export default router