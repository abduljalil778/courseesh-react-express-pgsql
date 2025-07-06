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
} from '../controllers/payments.controller.js';
import {
  paymentIdValidator,
  createPaymentValidator,
  updatePaymentValidator
} from '../validators/paymentsValidators.js';
import { runValidation } from '../middleware/validate.js';
import asyncHandler from 'express-async-handler';
import { upload, } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

// List all payments (ADMIN or FINANCE)
router.get(
  '/',
  authorize('ADMIN', 'FINANCE'),
  asyncHandler(getAllPayments)
);

// Get a single payment (ADMIN or FINANCE)
router.get(
  '/:id',
  authorize('ADMIN','FINANCE'),
  paymentIdValidator,
  runValidation,
  asyncHandler(getPaymentById)
);

// Create a payment (ADMIN or FINANCE)
router.post(
  '/',
  authorize('ADMIN','FINANCE'),
  createPaymentValidator,
  runValidation,
  asyncHandler(createPayment)
);

// Update a payment (ADMIN or FINANCE)
router.put(
  '/:id',
  authorize('ADMIN','FINANCE'),
  updatePaymentValidator,
  runValidation,
  asyncHandler(updatePayment)
);

// Delete a payment (ADMIN or FINANCE)
router.delete(
  '/:id',
  authorize('ADMIN','FINANCE'),
  paymentIdValidator,
  runValidation,
  asyncHandler(deletePayment)
);


router.post(
  '/:id/upload-proof',
  authorize('STUDENT'),
  paymentIdValidator,
  runValidation,
  upload.single('proof'),
  asyncHandler(uploadProofOfPayment)
)

export default router;
