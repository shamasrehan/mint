/**
 * Main entry point for the Smart Contract Generator application
 */
require('dotenv').config();
const app = require('./src/app');
const config = require('./src/config');

// Start server
const server = app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Default contract language: ${config.defaultLanguage}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  // In a production environment, you might want to implement
  // more sophisticated error handling here
  if (process.env.NODE_ENV === 'production') {
    server.close(() => {
      process.exit(1);
    });
  }
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In a production environment, you might want to handle this differently
});