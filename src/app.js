/**
 * Express app configuration
 */
const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./api/routes');
const errorMiddleware = require('./api/middleware/error.middleware');
const loggingMiddleware = require('./api/middleware/logging.middleware');


// Initialize Express app
const app = express();

// Apply middleware
app.use(loggingMiddleware); // Add this before other middleware
// Apply middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// API routes
app.use('/api', routes);

// Error handling middleware - must be after routes
app.use(errorMiddleware);

module.exports = app;