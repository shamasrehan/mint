/**
 * Enhanced error handling middleware with better error classification,
 * detailed logging, and appropriate error responses.
 */
const config = require('../../config');
const logger = require('../../utils/logger');

/**
 * Custom error classes for better error handling
 */
class AppError extends Error {
  constructor(message, statusCode = 500, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = options.isOperational !== false; // Default to true
    this.code = options.code || 'INTERNAL_ERROR';
    this.context = options.context || {};
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation error
class ValidationError extends AppError {
  constructor(message, context = {}) {
    super(message, 400, { 
      code: 'VALIDATION_ERROR',
      isOperational: true,
      context
    });
  }
}

// Not found error
class NotFoundError extends AppError {
  constructor(message = 'Resource not found', context = {}) {
    super(message, 404, {
      code: 'NOT_FOUND',
      isOperational: true,
      context
    });
  }
}

// Unauthorized error
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', context = {}) {
    super(message, 401, {
      code: 'UNAUTHORIZED',
      isOperational: true,
      context
    });
  }
}

// Service unavailable error
class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable', context = {}) {
    super(message, 503, {
      code: 'SERVICE_UNAVAILABLE',
      isOperational: true,
      context
    });
  }
}

/**
 * Error classification helper
 * @param {Error} err - The error to classify
 * @returns {Object} Classified error with appropriate status and code
 */
function classifyError(err) {
  // If it's already our AppError, use it as is
  if (err instanceof AppError) {
    return err;
  }
  
  // OpenAI API errors
  if (err.name === 'OpenAIError' || 
      (err.originalError && err.originalError.name === 'OpenAIError')) {
    // Rate limiting
    if (err.status === 429 || (err.originalError && err.originalError.status === 429)) {
      return new ServiceUnavailableError('AI service rate limit exceeded. Please try again later.', {
        code: 'RATE_LIMIT_EXCEEDED',
        retryable: true
      });
    }
    
    // Server errors
    if (err.status >= 500 || (err.originalError && err.originalError.status >= 500)) {
      return new ServiceUnavailableError('AI service unavailable. Please try again later.', {
        code: 'SERVICE_ERROR',
        retryable: true
      });
    }
    
    // Authentication errors
    if (err.status === 401 || (err.originalError && err.originalError.status === 401)) {
      return new AppError('API authentication failed', 500, {
        code: 'AUTH_ERROR',
        isOperational: false // Requires admin attention
      });
    }
    
    // Default case for OpenAI errors
    return new AppError('Error communicating with AI service', 500, {
      code: 'AI_SERVICE_ERROR',
      isOperational: true,
      retryable: true
    });
  }
  
  // Validation errors
  if (err.name === 'ValidationError' || err.name === 'SyntaxError') {
    return new ValidationError(err.message, {
      details: err.details || err.errors
    });
  }
  
  // Timeout errors
  if (err.name === 'TimeoutError' || err.message.includes('timeout')) {
    return new ServiceUnavailableError('Request timed out. Please try again later.', {
      code: 'TIMEOUT',
      retryable: true
    });
  }
  
  // Not found errors
  if (err.message && err.message.toLowerCase().includes('not found')) {
    return new NotFoundError(err.message);
  }
  
  // Handle all other errors as internal server errors
  return new AppError(err.message || 'An unexpected error occurred', 500, {
    isOperational: false,
    originalError: err
  });
}

/**
 * Global error handler for Express
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorMiddleware(err, req, res, next) {
  // Classify the error
  const classifiedError = classifyError(err);
  
  // Get request ID if available
  const requestId = req.requestId || 'unknown';
  
  // Determine if this is an operational error or programming error
  const isOperational = classifiedError.isOperational !== false;
  
  // Log error with appropriate level and details
  const logMethod = isOperational ? 'warn' : 'error';
  const logMessage = `[${requestId}] ${classifiedError.name}: ${classifiedError.message}`;
  
  const logDetails = {
    statusCode: classifiedError.statusCode,
    code: classifiedError.code,
    path: req.path,
    method: req.method,
    requestId
  };
  
  // Include stack trace for non-operational errors
  if (!isOperational) {
    logDetails.stack = classifiedError.stack;
    
    // Include original error details if available
    if (classifiedError.originalError) {
      logDetails.originalError = {
        name: classifiedError.originalError.name,
        message: classifiedError.originalError.message,
        stack: classifiedError.originalError.stack
      };
    }
  }
  
  // Log the error
  logger[logMethod](logMessage, logDetails);
  
  // Determine HTTP status code
  const statusCode = classifiedError.statusCode || 500;
  
  // Prepare user-friendly error response
  const errorResponse = {
    error: classifiedError.message || 'Internal Server Error',
    code: classifiedError.code || 'INTERNAL_ERROR',
    status: statusCode,
    requestId
  };
  
  // Add retryable flag if present (helps client decide if it should retry)
  if (classifiedError.retryable !== undefined) {
    errorResponse.retryable = classifiedError.retryable;
  }
  
  // Add validation details if available
  if (classifiedError instanceof ValidationError && classifiedError.context.details) {
    errorResponse.details = classifiedError.context.details;
  }
  
  // Add stack trace in development mode for non-operational errors
  if (config.nodeEnv === 'development' && !isOperational) {
    errorResponse.stack = classifiedError.stack;
    
    // Add original error in development for debugging
    if (classifiedError.originalError) {
      errorResponse.originalError = {
        name: classifiedError.originalError.name,
        message: classifiedError.originalError.message
      };
    }
  }
  
  // Send error response
  res.status(statusCode).json(errorResponse);
  
  // If this is a severe error, we might want to do additional handling
  if (!isOperational) {
    // In a production app, you might want to notify administrators,
    // restart the process, or perform other recovery actions
    
    // For now, just log a critical message
    logger.error(`CRITICAL: Non-operational error occurred: ${err.message}`, {
      error: err,
      requestId
    });
  }
}

module.exports = {
  errorMiddleware,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ServiceUnavailableError,
  AppError
};