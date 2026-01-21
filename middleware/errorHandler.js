const AppError = require('../utils/AppError');

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Sequelize Validation Error
    if (err.name === 'SequelizeValidationError') {
      error = handleSequelizeValidationError(err);
    }

    // Sequelize Unique Constraint Error
    if (err.name === 'SequelizeUniqueConstraintError') {
      error = handleSequelizeUniqueError(err);
    }

    // Sequelize Database Error
    if (err.name === 'SequelizeDatabaseError') {
      error = handleSequelizeDatabaseError(err);
    }

    // JWT Error
    if (err.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }

    // JWT Expired Error
    if (err.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }

    sendErrorProd(error, res);
  }
};

// Send error in development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// Send error in production
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message
    });
  } 
  // Programming or unknown error: don't leak error details
  else {
    console.error('ERROR 💥', err);

    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong!'
    });
  }
};

// Handle Sequelize Validation Error
const handleSequelizeValidationError = (err) => {
  const errors = err.errors.map(e => e.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Handle Sequelize Unique Constraint Error
const handleSequelizeUniqueError = (err) => {
  const field = Object.keys(err.fields)[0];
  const message = `${field} already exists. Please use another value.`;
  return new AppError(message, 400);
};

// Handle Sequelize Database Error
const handleSequelizeDatabaseError = (err) => {
  const message = 'Database error occurred';
  return new AppError(message, 400);
};

// Handle JWT Error
const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again.', 401);
};

// Handle JWT Expired Error
const handleJWTExpiredError = () => {
  return new AppError('Your token has expired. Please log in again.', 401);
};

// Not Found Handler (404)
const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

module.exports = { errorHandler, notFound };