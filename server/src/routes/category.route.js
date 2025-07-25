import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../controllers/category.controller.js';
import asyncHandler from 'express-async-handler';
import { categoryValidator, idValidator } from '../validators/categoryValidator.js'; 
import { runValidation } from '../middleware/validate.js';

const router = express.Router();

// Rute publik untuk mendapatkan semua kategori
router.get('/', asyncHandler(getAllCategories));

// Rute hanya untuk Admin
router.post('/', authenticate, authorize('ADMIN'), categoryValidator, runValidation, asyncHandler(createCategory));
router.put('/:id', authenticate, authorize('ADMIN'), idValidator, categoryValidator, runValidation, asyncHandler(updateCategory));
router.delete('/:id', authenticate, authorize('ADMIN'), idValidator, runValidation, asyncHandler(deleteCategory));

export default router;