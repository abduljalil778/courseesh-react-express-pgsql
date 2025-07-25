import * as usersService from '../services/users.service.js';
import asyncHandler from 'express-async-handler';

/**
 * Controller untuk mengambil semua user.
 * GET /api/users
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const result = await usersService.getAllUsersService(req.query);
  res.status(200).json(result);
});

/**
 * Controller untuk mengambil user tunggal berdasarkan ID.
 * GET /api/users/:id
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await usersService.getUserByIdService(req.params.id);
  res.status(200).json(user);
});

/**
 * Controller untuk mengambil profil publik seorang guru.
 * GET /api/teachers/:teacherId/profile
 */
export const getTeacherPublicProfile = asyncHandler(async (req, res) => {
    const publicProfile = await usersService.getTeacherPublicProfileService(req.params.teacherId);
    res.status(200).json({ data: publicProfile });
});


/**
 * Controller untuk mengambil profil user yang sedang login.
 * GET /api/users/me
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const userProfile = await usersService.getMyProfileService(req.user.id);
  res.status(200).json({ data: userProfile });
});

/**
 * Controller untuk membuat user baru.
 * POST /api/users
 */
export const createUser = asyncHandler(async (req, res) => {
  const newUser = await usersService.createUserService(req.body);
  res.status(201).json(newUser);
});

/**
 * Controller untuk memperbarui user.
 * PUT /api/users/:id
 */
export const updateUser = asyncHandler(async (req, res) => {
  // Controller hanya meneruskan data, service yang akan melakukan otorisasi
  const updatedUser = await usersService.updateUserService(req.params.id, req.body, req.user);
  res.status(200).json({ data: updatedUser });
});

/**
 * Controller untuk mengubah password.
 * PUT /api/users/me/change-password
 */
export const changePassword = asyncHandler(async (req, res) => {
  await usersService.changePasswordService(req.user.id, req.body);
  res.status(200).json({ message: 'Password changed successfully.' });
});

/**
 * Controller untuk menghapus user.
 * DELETE /api/users/:id
 */
export const deleteUser = asyncHandler(async (req, res) => {
  await usersService.deleteUserService(req.params.id);
  res.status(204).send();
});

/**
 * Controller untuk mengunggah avatar.
 * POST /api/users/me/upload-avatar
 */
export const uploadAvatar = asyncHandler(async (req, res) => {
    const updatedUser = await usersService.uploadAvatarService(req.user.id, req.file);
    res.status(200).json(updatedUser);
});

/**
 * Controller untuk memperbarui info bank milik teacher.
 * PUT /api/users/me/payout-info
 */
export const updateMyPayoutInfo = asyncHandler(async (req, res) => {
    const updatedUser = await usersService.updateMyPayoutInfoService(req.user.id, req.body);
    res.status(200).json(updatedUser);
});