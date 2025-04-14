// app.js
const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./api/routes');
const errorMiddleware = require('./api/middleware/error.middleware');
const loggingMiddleware = require('./api/middleware/logging.middleware');

// Initialize Express
const app = express();

// Example logging middleware usage
if (typeof loggingMiddleware === 'function') {
  app.use(loggingMiddleware);
} else if (loggingMiddleware.httpLoggerMiddleware) {
  app.use(loggingMiddleware.httpLoggerMiddleware());
} else if (loggingMiddleware.createLoggingMiddleware) {
  app.use(loggingMiddleware.createLoggingMiddleware()());
}

// Parse JSON
app.use(bodyParser.json());

// Serve static files (front-end)
app.use(express.static('public'));

// API routes
app.use('/api', routes);

// Error handling
if (typeof errorMiddleware === 'function') {
  app.use(errorMiddleware);
} else if (errorMiddleware.errorMiddleware) {
  app.use(errorMiddleware.errorMiddleware);
}

module.exports = app;
