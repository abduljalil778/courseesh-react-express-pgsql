// src/middleware/validate.js
import { validationResult } from 'express-validator';

export const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // collect all messages into one string
    const msg = errors.array().map(e => `${e.param}: ${e.msg}`).join('; ');
    return next(new Error(msg, 400));
  }
  next();
};
