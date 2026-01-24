const AppError = require('../utils/AppError');

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Map known errors to AppError
  const mappedError = mapKnownError(err);
  
  sendError(mappedError, res);
};

// Unified error sender
const sendError = (err, res) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Base response
  const response = {
    success: false,
    status: err.status,
    message: err.message
  };

  if (isDevelopment) {
    // Development: send full details
    response.error = err;
    response.stack = err.stack;
  } else {
    // Production: only send message if operational error
    if (!err.isOperational) {
      console.error('ERROR 💥', err);
      response.message = 'Something went wrong!';
    }
  }

  res.status(err.statusCode).json(response);
};

// Map known errors to AppError
const mapKnownError = (err) => {
  const errorMap = {
    'SequelizeValidationError': () => {
      const errors = err.errors.map(e => e.message);
      return new AppError(`Invalid input data. ${errors.join('. ')}`, 400);
    },
    'SequelizeUniqueConstraintError': () => {
      const field = Object.keys(err.fields)[0];
      return new AppError(`${field} already exists. Please use another value.`, 400);
    },
    'SequelizeDatabaseError': () => {
      // Show the actual database error message for debugging
      const errorMessage = err.message || 'Database error occurred';
      console.error('Database Error:', errorMessage);
      console.error('SQL:', err.sql);
      return new AppError(`Database error: ${errorMessage}`, 400);
    },
    'JsonWebTokenError': () => {
      return new AppError('Invalid token. Please log in again.', 401);
    },
    'TokenExpiredError': () => {
      return new AppError('Your token has expired. Please log in again.', 401);
    }
  };

  // If error type is in map, use it; otherwise return original error
  return errorMap[err.name] ? errorMap[err.name]() : err;
};

// Not Found Handler (404)
const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

module.exports = { errorHandler, notFound };