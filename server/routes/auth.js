// // src/routes/auth.js
// import express from 'express';
// import { register, login } from '../controllers/authController.js';

// const router = express.Router();

// // Register new user (default STUDENT, or pass role in body)
// router.post('/register', register);

// // Login existing user
// router.post('/login', login);

// export default router;


// src/routes/auth.js
import express from 'express';
import { register, login } from '../controllers/authController.js';
import { registerValidator, loginValidator } from '../validators/authValidators.js';
import { runValidation } from '../middleware/validate.js';
import catchAsync from '../utils/catchAsync.js';

const router = express.Router();

router.post(
  '/register',
  registerValidator,
  runValidation,
  catchAsync(register)
);

router.post(
  '/login',
  loginValidator,
  runValidation,
  catchAsync(login)
);

export default router;
