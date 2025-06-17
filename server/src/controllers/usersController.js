import * as userService from '../services/usersService.js';
import catchAsync from '../utils/catchAsync.js';

export const getAllUsers = catchAsync(async (req, res) => {
  const result = await userService.getAllUsers(req.query);
  res.json(result);
});

export const getUserById = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.json(user);
});

export const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json(user);
});

export const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res.json(user);
});

export const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.status(204).send();
});

export const uploadAvatar = catchAsync(async (req, res) => {
  const user = await userService.uploadAvatar(req.user.id, req.file);
  res.json(user);
});

export const updateMyPayoutInfo = catchAsync(async (req, res) => {
  const user = await userService.updateMyPayoutInfo(req.user.id, req.body);
  res.json(user);
});