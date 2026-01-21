/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 * @param {Object} errors - Additional error details (optional)
 */
const sendError = (res, statusCode = 500, message = 'Internal Server Error', errors = null) => {
  const response = {
    success: false,
    status: statusCode,
    message
  };

  if (errors !== null) {
    response.errors = errors;
  }

  if (process.env.NODE_ENV === 'development' && errors?.stack) {
    response.stack = errors.stack;
  }

  return res.status(statusCode).json(response);
};

module.exports = sendError;