import { Prisma } from '@prisma/client';
import prisma from '../../libs/prisma.js';
import AppError from '../utils/AppError.mjs';

/**
 * Service untuk mengambil semua opsi pembayaran yang aktif (untuk publik/siswa).
 * @returns {Promise<Array>}
 */
export async function getActivePaymentOptionsService() {
  return await prisma.paymentOption.findMany({
    where: { isActive: true },
    orderBy: { bankName: 'asc' },
  });
}

/**
 * Service untuk mengambil semua opsi pembayaran (untuk admin).
 * @returns {Promise<Array>}
 */
export async function getAllPaymentOptionsService() {
  return await prisma.paymentOption.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Service untuk membuat opsi pembayaran baru (Admin).
 * @param {object} optionData - Data untuk opsi pembayaran baru.
 * @returns {Promise<object>}
 */
export async function createPaymentOptionService(optionData) {
  const { bankName, accountHolder, accountNumber, logoUrl, isActive } = optionData;
  try {
    return await prisma.paymentOption.create({
      data: { bankName, accountHolder, accountNumber, logoUrl, isActive },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AppError('Account number must be unique.', 409);
    }
    throw new AppError(err.message, 500);
  }
}

/**
 * Service untuk memperbarui opsi pembayaran (Admin).
 * @param {string} optionId - ID dari opsi pembayaran yang akan diperbarui.
 * @param {object} optionData - Data baru untuk opsi pembayaran.
 * @returns {Promise<object>}
 */
export async function updatePaymentOptionService(optionId, optionData) {
  const { bankName, accountHolder, accountNumber, logoUrl, isActive } = optionData;
  try {
    return await prisma.paymentOption.update({
      where: { id: optionId },
      data: { bankName, accountHolder, accountNumber, logoUrl, isActive },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        throw new AppError('Payment option not found.', 404);
      }
      if (err.code === 'P2002') {
        throw new AppError('Account number must be unique.', 409);
      }
    }
    throw new AppError(err.message, 500);
  }
}

/**
 * Service untuk menghapus opsi pembayaran (Admin).
 * @param {string} optionId - ID dari opsi pembayaran yang akan dihapus.
 */
export async function deletePaymentOptionService(optionId) {
  try {
    await prisma.paymentOption.delete({
      where: { id: optionId },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw new AppError('Payment option not found.', 404);
    }
    throw new AppError(err.message, 500);
  }
}