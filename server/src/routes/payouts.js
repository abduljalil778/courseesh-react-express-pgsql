import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
    getAllTeacherPayouts,
    getTeacherPayoutById,
    updateTeacherPayout,
} from '../controllers/payoutsController.js';
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
    authorize('ADMIN', 'FINANCE'),
    listPayoutsQueryValidator,
    runValidation,
    catchAsync(getAllTeacherPayouts)
);

// get teacher payout by id
router.get(
    '/teacher-payouts/:payoutId',
    authorize('ADMIN', 'FINANCE'),
    payoutIdParamValidator,
    runValidation,
    catchAsync(getTeacherPayoutById)
)


// Update teacher payout (ADMIN or FINANCE)
router.put(
    '/teacher-payouts/:payoutId',
    authorize('ADMIN','FINANCE'),
    upload.single('adminProof'),
    payoutIdParamValidator,
    updatePayoutStatusValidator,
    runValidation,
    catchAsync(updateTeacherPayout)
)

export default router