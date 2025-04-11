/**
 * API request logging middleware
 */

function loggingMiddleware(req, res, next) {
  // Capture request timestamp
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(2, 10);
  
  // Log request details
  console.log(`[${requestId}] ${req.method} ${req.originalUrl} - Request started`);
  
  // Create a reference to the original end method
  const originalEnd = res.end;
  
  // Override the end method to log response details
  res.end = function(chunk, encoding) {
    // Calculate request duration
    const duration = Date.now() - start;
    
    // Log response details
    console.log(`[${requestId}] ${req.method} ${req.originalUrl} - Response: ${res.statusCode} (${duration}ms)`);
    
    // Call the original end method
    originalEnd.call(this, chunk, encoding);
  };
  
  // Continue to the next middleware
  next();
}

module.exports = loggingMiddleware;