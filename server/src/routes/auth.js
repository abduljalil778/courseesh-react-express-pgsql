import express from 'express';
import { register, login } from '../controllers/authController.js';
import { registerValidator, loginValidator } from '../validators/authValidators.js';
import { runValidation } from '../middleware/validate.js';

const router = express.Router();

router.post(
  '/register',
  registerValidator,
  runValidation,
  register
);

router.post(
  '/login',
  loginValidator,
  runValidation,
  login
);

export default router;
