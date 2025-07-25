import * as paymentOptionsService from '../services/paymentOptions.service.js';
import asyncHandler from 'express-async-handler';

/**
 * Controller untuk mengambil opsi pembayaran yang aktif (Publik).
 * GET /api/payment-options
 */
export const getActivePaymentOptions = asyncHandler(async (req, res) => {
  const options = await paymentOptionsService.getActivePaymentOptionsService();
  res.status(200).json(options);
});

/**
 * Controller untuk mengambil semua opsi pembayaran (Admin).
 * GET /api/admin/payment-options
 */
export const getAllPaymentOptions = asyncHandler(async (req, res) => {
  const options = await paymentOptionsService.getAllPaymentOptionsService();
  res.status(200).json(options);
});

/**
 * Controller untuk membuat opsi pembayaran baru (Admin).
 * POST /api/admin/payment-options
 */
export const createPaymentOption = asyncHandler(async (req, res) => {
  const newOption = await paymentOptionsService.createPaymentOptionService(req.body);
  res.status(201).json(newOption);
});

/**
 * Controller untuk memperbarui opsi pembayaran (Admin).
 * PUT /api/admin/payment-options/:id
 */
export const updatePaymentOption = asyncHandler(async (req, res) => {
  const updatedOption = await paymentOptionsService.updatePaymentOptionService(req.params.id, req.body);
  res.status(200).json(updatedOption);
});

/**
 * Controller untuk menghapus opsi pembayaran (Admin).
 * DELETE /api/admin/payment-options/:id
 */
export const deletePaymentOption = asyncHandler(async (req, res) => {
  await paymentOptionsService.deletePaymentOptionService(req.params.id);
  res.status(204).send();
});