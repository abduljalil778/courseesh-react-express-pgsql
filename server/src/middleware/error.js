import AppError from '../utils/AppError.mjs';

export default (err, req, res, next) => {
  console.error('🚨 Server error:', err);
  err.statusCode = err.statusCode || 500;
  err.status     = err.status     || 'error';

  // only send stack in dev
  const response = {
    status: err.status,
    message: err.isOperational ? err.message : 'Something went wrong'
  };
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.error = err;
  }

  res.status(err.statusCode).json(response);
};
