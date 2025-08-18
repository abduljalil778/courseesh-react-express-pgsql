import * as authService from '../services/auth.service.js';
import asyncHandler from 'express-async-handler';

/**
 * Controller untuk menangani registrasi user.
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const result = await authService.registerService({ name, email, password, role });

  res.status(201).json(result);
});

/**
 * Controller untuk menangani login user.
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  const result = await authService.loginService({ email, password });

  res.status(200).json(result);
});