import * as categoryService from '../services/category.service.js';
import asyncHandler from 'express-async-handler';

export const getAllCategories = asyncHandler(async (req, res, next) => {
    const categories = await categoryService.getAllCategoriesService();

    res.status(200).json({ data: categories });
})

export const createCategory = asyncHandler(async (req, res) => {
  const newCategory = await categoryService.createCategoryService(req.body);
  res.status(201).json(newCategory);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const updatedCategory = await categoryService.updateCategoryService(req.params.id, req.body);
  res.status(200).json(updatedCategory);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategoryService(req.params.id);
  res.status(204).send();
});