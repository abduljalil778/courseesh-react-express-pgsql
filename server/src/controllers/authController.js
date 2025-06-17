import * as authService from '../services/authService.js';
import catchAsync from '../utils/catchAsync.js';

export const register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

export const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
});