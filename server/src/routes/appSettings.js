// server/routes/appSettings.js

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { runValidation } from '../middleware/validate.js';
import catchAsync from '../utils/catchAsync.js';
import { getAllSettings, updateSettings } from '../controllers/appSettingsController.js';
import { updateSettingsValidator } from '../validators/appSettingsValidator.js';

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

router.get(
  '/',
  catchAsync(getAllSettings)
);

router.put(
  '/',
  updateSettingsValidator,
  runValidation,
  catchAsync(updateSettings)
);

export default router;