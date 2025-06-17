import { Prisma } from '@prisma/client';
import prisma from '../../libs/prisma.js';
import AppError from '../utils/AppError.mjs';

// --- Untuk Publik (Siswa di Halaman Pembayaran) ---

// GET /api/payment-options
export const getActivePaymentOptions = async (req, res, next) => {
  try {
    const options = await prisma.paymentOption.findMany({
      where: { isActive: true },
      orderBy: { bankName: 'asc' },
    });
    res.json(options);
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

// --- Untuk Admin ---

// GET /api/admin/payment-options
export const getAllPaymentOptions = async (req, res, next) => {
  try {
    const options = await prisma.paymentOption.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(options);
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

// POST /api/admin/payment-options
export const createPaymentOption = async (req, res, next) => {
  const { bankName, accountHolder, accountNumber, logoUrl, isActive } = req.body;
  try {
    const newOption = await prisma.paymentOption.create({
      data: { bankName, accountHolder, accountNumber, logoUrl, isActive },
    });
    res.status(201).json(newOption);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return next(new AppError('Account number must be unique.', 409));
    }
    next(new AppError(err.message, 500));
  }
};

// PUT /api/admin/payment-options/:id
export const updatePaymentOption = async (req, res, next) => {
  const { id } = req.params;
  const { bankName, accountHolder, accountNumber, logoUrl, isActive } = req.body;
  try {
    const updatedOption = await prisma.paymentOption.update({
      where: { id },
      data: { bankName, accountHolder, accountNumber, logoUrl, isActive },
    });
    res.json(updatedOption);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return next(new AppError('Payment option not found.', 404));
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return next(new AppError('Account number must be unique.', 409));
    }
    next(new AppError(err.message, 500));
  }
};

// DELETE /api/admin/payment-options/:id
export const deletePaymentOption = async (req, res, next) => {
  const { id } = req.params;
  try {
    await prisma.paymentOption.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return next(new AppError('Payment option not found.', 404));
    }
    next(new AppError(err.message, 500));
  }
};