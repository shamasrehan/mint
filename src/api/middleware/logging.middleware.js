/**
 * Enhanced request logging middleware with timing, correlation IDs,
 * and request/response body logging where appropriate
 */
const logger = require('../../utils/logger');

/**
 * Create a middleware function that logs requests and responses
 * with detailed timing, correlation IDs, and selective body logging
 * 
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware function
 */
function createLoggingMiddleware(options = {}) {
  const {
    logBody = true,       // Whether to log request and response bodies
    maxBodyLength = 1000, // Maximum length of logged bodies
    sensitiveHeaders = [  // Headers that should be redacted from logs
      'authorization',
      'cookie',
      'set-cookie',
      'x-api-key',
      'x-forwarded-for'
    ],
    sensitiveBodyFields = [  // Body fields that should be redacted from logs
      'password',
      'token',
      'secret',
      'apiKey',
      'api_key',
      'key'
    ],
    excludePaths = [      // Paths to exclude from body logging
      '/api/health',
      '/api/metrics'
    ]
  } = options;
  
  /**
   * Redact sensitive values from headers or body objects
   * @param {Object} obj - Object to redact
   * @param {Array} sensitiveFields - Fields to redact
   * @returns {Object} Redacted object
   */
  function redactSensitiveData(obj, sensitiveFields) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const redacted = { ...obj };
    
    // Redact sensitive fields
    Object.keys(redacted).forEach(key => {
      // Check if the key is sensitive (case-insensitive)
      const isKeySensitive = sensitiveFields.some(field => 
        field.toLowerCase() === key.toLowerCase()
      );
      
      if (isKeySensitive) {
        redacted[key] = '[REDACTED]';
      } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
        // Recursively redact nested objects
        redacted[key] = redactSensitiveData(redacted[key], sensitiveFields);
      }
    });
    
    return redacted;
  }
  
  /**
   * Truncate string to maximum length with ellipsis
   * @param {string} str - String to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated string
   */
  function truncate(str, maxLength) {
    if (!str || typeof str !== 'string') return str;
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  }
  
  /**
   * Format an object for logging, handling circular references
   * @param {any} obj - Object to format
   * @returns {string} Formatted string
   */
  function formatForLogging(obj) {
    if (!obj) return '';
    
    try {
      const cache = new Set();
      const formatted = JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (cache.has(value)) {
            return '[Circular]';
          }
          cache.add(value);
        }
        return value;
      }, 2);
      
      return truncate(formatted, maxBodyLength);
    } catch (err) {
      return `[Unserializable: ${err.message}]`;
    }
  }
  
  // Return the middleware function
  return (req, res, next) => {
    // Skip excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    // Generate unique request ID if not already set
    req.id = req.id || 
              req.headers['x-request-id'] || 
              req.headers['x-correlation-id'] || 
              `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    
    // Add the request ID to response headers
    res.setHeader('X-Request-ID', req.id);
    
    // Capture start time
    const startTime = Date.now();
    
    // Get request-scoped logger
    const reqLogger = logger.request(req);
    
    // Log request
    const requestInfo = {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      referer: req.headers.referer || req.headers.referrer || '',
      requestId: req.id
    };
    
    // Add headers (redacted)
    if (req.headers) {
      requestInfo.headers = redactSensitiveData(req.headers, sensitiveHeaders);
    }
    
    // Add body for non-GET requests if enabled
    if (logBody && req.method !== 'GET' && req.body) {
      try {
        const redactedBody = redactSensitiveData(req.body, sensitiveBodyFields);
        requestInfo.body = formatForLogging(redactedBody);
      } catch (err) {
        requestInfo.body = '[Error serializing request body]';
      }
    }
    
    reqLogger.info(`${req.method} ${req.originalUrl || req.url}`, requestInfo);
    
    // Capture original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;
    
    // Track response body
    let responseBody;
    
    // Override res.sen// Override res.send
    res.send = function(body) {
      responseBody = body;
      return originalSend.apply(res, arguments);
    };
    
    // Override res.json
    res.json = function(body) {
      responseBody = body;
      return originalJson.apply(res, arguments);
    };
    
    // Override res.end
    res.end = function(chunk, encoding) {
      const responseTime = Date.now() - startTime;
      
      // Log response
      const responseInfo = {
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        requestId: req.id
      };
      
      // Add response body if enabled and available
      if (logBody && responseBody) {
        try {
          let parsedBody;
          
          // Handle string response bodies (try to parse as JSON)
          if (typeof responseBody === 'string') {
            try {
              parsedBody = JSON.parse(responseBody);
            } catch (e) {
              // Not JSON, use as is but truncate if needed
              parsedBody = truncate(responseBody, maxBodyLength);
            }
          } else {
            parsedBody = responseBody;
          }
          
          // Redact sensitive fields
          const redactedBody = redactSensitiveData(parsedBody, sensitiveBodyFields);
          responseInfo.body = formatForLogging(redactedBody);
        } catch (err) {
          responseInfo.body = '[Error serializing response body]';
        }
      }
      
      // Determine log level based on status code
      let logLevel = 'info';
      if (res.statusCode >= 500) {
        logLevel = 'error';
      } else if (res.statusCode >= 400) {
        logLevel = 'warn';
      } else if (res.statusCode >= 300) {
        logLevel = 'http';
      }
      
      // Log response
      reqLogger[logLevel](
        `${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${responseTime}ms`,
        responseInfo
      );
      
      // Call original end method
      return originalEnd.apply(res, arguments);
    };
    
    next();
  };
}

/**
 * Default logging middleware configuration
 */
const loggingMiddleware = createLoggingMiddleware({
  // Default options
  logBody: process.env.NODE_ENV !== 'production', // Only log bodies in non-production
  maxBodyLength: 1000,
  excludePaths: ['/api/health', '/api/metrics']
});

module.exports = loggingMiddleware;

// Export the factory function for custom configurations
module.exports.createLoggingMiddleware = createLoggingMiddleware;