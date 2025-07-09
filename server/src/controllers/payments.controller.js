import * as paymentsService from '../services/payments.service.js';
import asyncHandler from 'express-async-handler';

/**
 * Controller untuk mengambil semua record pembayaran.
 * GET /api/payments
 */
export const getAllPayments = asyncHandler(async (req, res) => {
  const payments = await paymentsService.getAllPaymentsService(req.query);
  res.status(200).json(payments);
});

/**
 * Controller untuk mengambil satu record pembayaran berdasarkan ID.
 * GET /api/payments/:id
 */
export const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await paymentsService.getPaymentByIdService(req.params.id);
  res.status(200).json(payment);
});

/**
 * Controller untuk membuat record pembayaran baru (Admin).
 * POST /api/payments
 */
export const createPayment = asyncHandler(async (req, res) => {
  const newPayment = await paymentsService.createPaymentService(req.body);
  res.status(201).json(newPayment);
});

/**
 * Controller untuk memperbarui record pembayaran.
 * PUT /api/payments/:id
 */
export const updatePayment = asyncHandler(async (req, res) => {
  const { status, amount, dueDate } = req.body;
  const updatedPayment = await paymentsService.updatePaymentService(req.params.id, { status, amount, dueDate });
  res.status(200).json(updatedPayment);
});

/**
 * Controller untuk menghapus record pembayaran.
 * DELETE /api/payments/:id
 */
export const deletePayment = asyncHandler(async (req, res) => {
  await paymentsService.deletePaymentService(req.params.id);
  res.status(204).send();
});

/**
 * Controller untuk siswa mengunggah bukti pembayaran.
 * POST /api/payments/:id/upload-proof
 */
export const uploadProofOfPayment = asyncHandler(async (req, res) => {
  const updatedPayment = await paymentsService.uploadProofOfPaymentService(req.params.id, req.user.id, req.file);
  res.status(200).json({ 
    message: 'Proof of payment uploaded successfully.', 
    payment: updatedPayment 
  });
});