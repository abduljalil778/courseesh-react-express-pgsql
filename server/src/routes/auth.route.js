import express from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { registerValidator, loginValidator } from '../validators/authValidators.js';
import { runValidation } from '../middleware/validate.js';
import asyncHandler from 'express-async-handler';

const router = express.Router();

router.post(
  '/register',
  registerValidator,
  runValidation,
  asyncHandler(register)
);

router.post(
  '/login',
  loginValidator,
  runValidation,
  asyncHandler(login)
);

export default router;
