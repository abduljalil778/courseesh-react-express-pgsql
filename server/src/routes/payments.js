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

// List all payments (ADMIN or FINANCE)
router.get(
  '/',
  authorize('ADMIN', 'FINANCE'),
  catchAsync(getAllPayments)
);

// Get a single payment (ADMIN or FINANCE)
router.get(
  '/:id',
  authorize('ADMIN','FINANCE'),
  paymentIdValidator,
  runValidation,
  catchAsync(getPaymentById)
);

// Create a payment (ADMIN or FINANCE)
router.post(
  '/',
  authorize('ADMIN','FINANCE'),
  createPaymentValidator,
  runValidation,
  catchAsync(createPayment)
);

// Update a payment (ADMIN or FINANCE)
router.put(
  '/:id',
  authorize('ADMIN','FINANCE'),
  updatePaymentValidator,
  runValidation,
  catchAsync(updatePayment)
);

// Delete a payment (ADMIN or FINANCE)
router.delete(
  '/:id',
  authorize('ADMIN','FINANCE'),
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
