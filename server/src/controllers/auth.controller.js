import * as authService from '../services/auth.service.js';
import asyncHandler from 'express-async-handler';

/**
 * Controller untuk menangani registrasi user.
 */
export const register = asyncHandler(async (req, res) => {
  // Controller mengambil data dari request body
  const { name, email, password, role } = req.body;

  // Memanggil service dengan data yang relevan
  const result = await authService.registerService({ name, email, password, role });

  // Controller mengirim respons sukses
  res.status(201).json(result);
});

/**
 * Controller untuk menangani login user.
 */
export const login = asyncHandler(async (req, res) => {
  // Controller mengambil data dari request body
  const { email, password } = req.body;
  
  // Memanggil service dengan data yang relevan
  const result = await authService.loginService({ email, password });

  // Controller mengirim respons sukses
  res.status(200).json(result);
});