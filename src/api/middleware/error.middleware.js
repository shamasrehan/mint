/**
 * Error handling middleware
 */
const config = require('../../config');

/**
 * Global error handler for Express
 */
function errorMiddleware(err, req, res, next) {
  // Log error
  console.error('Error caught in middleware:', err);
  
  // Get status code
  const statusCode = err.statusCode || 500;
  
  // Prepare error response
  const errorResponse = {
    error: err.message || 'Internal Server Error',
    status: statusCode
  };
  
  // Add stack trace in development mode
  if (config.nodeEnv === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err.details || err.originalError || {};
  }
  
  // Send error response
  res.status(statusCode).json(errorResponse);
}

module.exports = errorMiddleware;