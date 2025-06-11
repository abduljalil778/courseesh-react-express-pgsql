// src/routes/payments.js
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  uploadProofOfPayment,
} from '../controllers/paymentsController.js';
import {
  paymentIdValidator,
  createPaymentValidator,
  updatePaymentValidator
} from '../validators/paymentsValidators.js';
import { runValidation } from '../middleware/validate.js';
import catchAsync from '../utils/catchAsync.js';
import { upload, } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

// List all payments (ADMIN only)
router.get(
  '/',
  authorize('ADMIN'),
  catchAsync(getAllPayments)
);

// Get a single payment (ADMIN only)
router.get(
  '/:id',
  paymentIdValidator,
  runValidation,
  catchAsync(getPaymentById)
);

// Create a payment (ADMIN only)
router.post(
  '/',
  createPaymentValidator,
  runValidation,
  catchAsync(createPayment)
);

// Update a payment (ADMIN only)
router.put(
  '/:id',
  updatePaymentValidator,
  runValidation,
  catchAsync(updatePayment)
);

// Delete a payment (ADMIN only)
router.delete(
  '/:id',
  paymentIdValidator,
  runValidation,
  catchAsync(deletePayment)
);


router.post(
  '/:id/upload-proof',
  authorize('STUDENT'),
  paymentIdValidator,
  runValidation,
  upload.single('proof'),
  catchAsync(uploadProofOfPayment)
)

export default router;
