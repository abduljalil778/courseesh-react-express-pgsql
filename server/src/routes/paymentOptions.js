// server/routes/paymentOptions.js
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { runValidation } from '../middleware/validate.js';
import { paymentOptionValidator, idValidator } from '../validators/paymentOptionValidators.js';
import catchAsync from '../utils/catchAsync.js';
import {
  getActivePaymentOptions,
  getAllPaymentOptions,
  createPaymentOption,
  updatePaymentOption,
  deletePaymentOption,
} from '../controllers/paymentOptionsController.js';

const router = express.Router();

// --- PUBLIC ROUTE ---
// Siswa mengambil daftar opsi pembayaran yang aktif
router.get('/payment-options', catchAsync(getActivePaymentOptions));


// --- ADMIN ROUTES ---
const adminRouter = express.Router();
adminRouter.use(authenticate, authorize('ADMIN'));



adminRouter.route('/payment-options')
  .get(catchAsync(getAllPaymentOptions))
  .post(paymentOptionValidator, runValidation, catchAsync(createPaymentOption));

adminRouter.route('/payment-options/:id')
  .put(idValidator, paymentOptionValidator, runValidation, catchAsync(updatePaymentOption))
  .delete(idValidator, runValidation, catchAsync(deletePaymentOption));

// Gunakan adminRouter dengan prefix /admin
router.use('/admin', adminRouter);


export default router;