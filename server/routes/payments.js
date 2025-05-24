// // server/routes/payments.js
// import express from 'express';
// import { authenticate, authorize } from '../middleware/auth.js';
// import {
//   getAllPayments,
//   getPaymentById,
//   createPayment,
//   updatePayment,
//   deletePayment
// } from '../controllers/paymentsController.js';

// const router = express.Router();

// // Only ADMIN can manage payments
// router.get('/', authenticate, authorize('ADMIN'), getAllPayments);
// router.get('/:id', authenticate, authorize('ADMIN'), getPaymentById);
// router.post('/', authenticate, authorize('ADMIN'), createPayment);
// router.put('/:id', authenticate, authorize('ADMIN'), updatePayment);
// router.delete('/:id', authenticate, authorize('ADMIN'), deletePayment);

// export default router;

// src/routes/payments.js
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment
} from '../controllers/paymentsController.js';
import {
  paymentIdValidator,
  createPaymentValidator,
  updatePaymentValidator
} from '../validators/paymentsValidators.js';
import { runValidation } from '../middleware/validate.js';
import catchAsync from '../utils/catchAsync.js';

const router = express.Router();

// List all payments (ADMIN only)
router.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  catchAsync(getAllPayments)
);

// Get a single payment (ADMIN only)
router.get(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  paymentIdValidator,
  runValidation,
  catchAsync(getPaymentById)
);

// Create a payment (ADMIN only)
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  createPaymentValidator,
  runValidation,
  catchAsync(createPayment)
);

// Update a payment (ADMIN only)
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  updatePaymentValidator,
  runValidation,
  catchAsync(updatePayment)
);

// Delete a payment (ADMIN only)
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  paymentIdValidator,
  runValidation,
  catchAsync(deletePayment)
);

export default router;
