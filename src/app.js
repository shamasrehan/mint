// src/app.js
const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./api/routes');
const errorMiddleware = require('./api/middleware/error.middleware');
const loggingMiddleware = require('./api/middleware/logging.middleware');

// Initialize Express app
const app = express();

// Apply middleware
app.use(typeof loggingMiddleware === 'function' ? loggingMiddleware : 
       (loggingMiddleware.httpLoggerMiddleware ? loggingMiddleware.httpLoggerMiddleware() : 
       (loggingMiddleware.createLoggingMiddleware ? loggingMiddleware.createLoggingMiddleware()() : null)));
       
app.use(bodyParser.json());
app.use(express.static('public'));

// API routes
app.use('/api', routes);

// Error handling middleware - must be after routes
app.use(typeof errorMiddleware === 'function' ? errorMiddleware : 
       (errorMiddleware.errorMiddleware ? errorMiddleware.errorMiddleware : null));

// Make sure we're exporting the Express app instance
module.exports = app;