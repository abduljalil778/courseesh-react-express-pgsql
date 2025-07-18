import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
    getAllTeacherPayouts,
    getTeacherPayoutById,
    updateTeacherPayout,
    getSessionsByPayoutId,
} from '../controllers/payouts.controller.js';
import asyncHandler from 'express-async-handler';
import { 
    payoutIdParamValidator, 
    updatePayoutStatusValidator,
    listPayoutsQueryValidator,
} from '../validators/teacherPayoutValidators.js';
import { runValidation } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Semua rute di sini memerlukan otentikasi
router.use(authenticate);

// List semua payout (hanya untuk Admin dan Finance)
router.get(
    '/teacher-payouts',
    authorize('ADMIN', 'FINANCE'),
    listPayoutsQueryValidator,
    runValidation,
    asyncHandler(getAllTeacherPayouts)
);

// Mengambil satu payout berdasarkan ID
router.get(
    '/teacher-payouts/:payoutId',
    authorize('ADMIN', 'FINANCE', 'TEACHER'),
    payoutIdParamValidator,
    runValidation,
    asyncHandler(getTeacherPayoutById)
)

// Memperbarui payout
router.put(
    '/teacher-payouts/:payoutId',
    authorize('ADMIN','FINANCE'),
    upload.single('adminProof'),
    payoutIdParamValidator,
    updatePayoutStatusValidator,
    runValidation,
    asyncHandler(updateTeacherPayout)
)

// mengambil detail sesi dari sebuah payout
router.get(
    '/teacher-payouts/:payoutId/sessions',
    authorize('ADMIN', 'FINANCE', 'TEACHER'),
    payoutIdParamValidator,
    runValidation,
    asyncHandler(getSessionsByPayoutId)
);

export default router;