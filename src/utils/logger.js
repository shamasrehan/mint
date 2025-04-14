/**
 * Unified logging utility for consistent logging across the application
 */
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Create formatter for console
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${
      info.stack ? `\n${info.stack}` : ''
    }${
      info.data ? `\n${JSON.stringify(info.data, null, 2)}` : ''
    }`
  )
);

// Create formatter for file logs (no colors, includes request ID)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format: fileFormat,
  defaultMeta: { service: 'smart-contract-hub' },
  transports: [
    // Write logs with level 'error' and 'warn' to error.log
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport in development or if explicitly enabled
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_CONSOLE_LOGS === 'true') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

/**
 * Create a middleware function for logging HTTP requests
 * @returns {Function} Express middleware function
 */
logger.httpLoggerMiddleware = () => {
  return (req, res, next) => {
    // Start timer
    const startHrTime = process.hrtime();
    
    // Generate unique request ID
    const requestId = req.id || 
      req.headers['x-request-id'] || 
      `req-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    
    // Store the request ID for later use
    req.requestId = requestId;
    
    // Log request
    logger.http(
      `${requestId} ${req.method} ${req.url}`,
      {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        referer: req.headers.referer || '',
        requestId,
      }
    );
    
    // Process request
    res.on('finish', () => {
      // Calculate duration
      const hrTime = process.hrtime(startHrTime);
      const durationMs = hrTime[0] * 1000 + hrTime[1] / 1000000;
      
      // Format duration for logging
      const duration = durationMs.toFixed(2);
      
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
      logger[logLevel](
        `${requestId} ${req.method} ${req.url} ${res.statusCode} ${duration}ms`,
        {
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          requestId,
        }
      );
    });
    
    next();
  };
};

// Export wrapper functions for consistent logging with request ID support
module.exports = {
  error: (message, meta = {}) => {
    logger.error(message, meta);
  },
  
  warn: (message, meta = {}) => {
    logger.warn(message, meta);
  },
  
  info: (message, meta = {}) => {
    logger.info(message, meta);
  },
  
  http: (message, meta = {}) => {
    logger.http(message, meta);
  },
  
  debug: (message, meta = {}) => {
    logger.debug(message, meta);
  },
  
  // Request-scoped logger (attaches request ID)
  request: (req) => {
    const requestId = req.requestId;
    
    return {
      error: (message, meta = {}) => {
        logger.error(message, { ...meta, requestId });
      },
      
      warn: (message, meta = {}) => {
        logger.warn(message, { ...meta, requestId });
      },
      
      info: (message, meta = {}) => {
        logger.info(message, { ...meta, requestId });
      },
      
      http: (message, meta = {}) => {
        logger.http(message, { ...meta, requestId });
      },
      
      debug: (message, meta = {}) => {
        logger.debug(message, { ...meta, requestId });
      },
    };
  },
  
  // HTTP logging middleware
  httpLoggerMiddleware: logger.httpLoggerMiddleware,
};