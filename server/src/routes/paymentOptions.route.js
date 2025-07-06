import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { runValidation } from '../middleware/validate.js';
import { paymentOptionValidator, idValidator } from '../validators/paymentOptionValidators.js';
import asyncHandler from 'express-async-handler';
import {
  getActivePaymentOptions,
  getAllPaymentOptions,
  createPaymentOption,
  updatePaymentOption,
  deletePaymentOption,
} from '../controllers/paymentOptions.controller.js';

const router = express.Router();

// --- PUBLIC ROUTE ---
// Siswa mengambil daftar opsi pembayaran yang aktif
router.get('/payment-options', asyncHandler(getActivePaymentOptions));


// --- ADMIN ROUTES ---
const adminRouter = express.Router();
adminRouter.use(authenticate, authorize('ADMIN'));



adminRouter.route('/payment-options')
  .get(asyncHandler(getAllPaymentOptions))
  .post(paymentOptionValidator, runValidation, asyncHandler(createPaymentOption));

adminRouter.route('/payment-options/:id')
  .put(idValidator, paymentOptionValidator, runValidation, asyncHandler(updatePaymentOption))
  .delete(idValidator, runValidation, asyncHandler(deletePaymentOption));

router.use('/admin', adminRouter);


export default router;