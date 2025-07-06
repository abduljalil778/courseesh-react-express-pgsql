// server/routes/appSettings.js

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { runValidation } from '../middleware/validate.js';
import asyncHandler from 'express-async-handler';
import { getAllSettings, updateSettings } from '../controllers/appSettings.controller.js';
import { updateSettingsValidator } from '../validators/appSettingsValidator.js';

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

router.get(
  '/',
  asyncHandler(getAllSettings)
);

router.put(
  '/',
  updateSettingsValidator,
  runValidation,
  asyncHandler(updateSettings)
);

export default router;