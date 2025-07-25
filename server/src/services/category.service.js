import prisma from '../../libs/prisma.js';
import AppError from '..//utils/AppError.mjs';
import { Prisma } from '@prisma/client';

/**
 * Service untuk mengambil semua kategori
 * @returns {Promise<Array>}
 */
export async function getAllCategoriesService() {
    try {
        return await prisma.category.findMany({
            orderBy: { name: 'asc' },
        })
    } catch (err) {
        throw new AppError('Failed to fetch categories', 500, err.message)
    }
}

/**
 * Service untuk membuat kategori baru.
 * @param {object} categoryData - Data kategori { name, description, isActive }.
 * @returns {Promise<object>}
 */
export async function createCategoryService(categoryData) {
  const { name, description, isActive } = categoryData;
  if (!name) {
    throw new AppError('Category name is required.', 400);
  }
  try {
    return await prisma.category.create({
      data: { name, description, isActive },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AppError(`A category with the name "${name}" already exists.`, 409);
    }
    throw new AppError(err.message, 500);
  }
}

/**
 * Service untuk memperbarui kategori.
 * @param {string} categoryId - ID kategori yang akan diperbarui.
 * @param {object} categoryData - Data baru untuk kategori.
 * @returns {Promise<object>}
 */
export async function updateCategoryService(categoryId, categoryData) {
  try {
    return await prisma.category.update({
      where: { id: categoryId },
      data: categoryData,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw new AppError('Category not found.', 404);
    }
    throw new AppError(err.message, 500);
  }
}

/**
 * Service untuk menghapus kategori.
 * @param {string} categoryId - ID kategori yang akan dihapus.
 */
export async function deleteCategoryService(categoryId) {
  try {
    // Periksa apakah kategori ini masih digunakan oleh kursus
    const coursesUsingCategory = await prisma.course.count({
      where: { categoryId: categoryId },
    });

    if (coursesUsingCategory > 0) {
      throw new AppError(`Cannot delete this category because it is still used by ${coursesUsingCategory} course(s).`, 400);
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw new AppError('Category not found.', 404);
    }
    if (err instanceof AppError) {
        throw err;
    }
    throw new AppError(err.message, 500);
  }
}