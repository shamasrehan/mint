// server.js
require('dotenv').config();  // <-- This loads .env!

const app = require('./src/app'); 
const config = require('./src/config');

// For safety, read port from config or process.env
const PORT = config.port || process.env.PORT || 3000;

// Validate 'app'
if (!app || typeof app.listen !== 'function') {
  console.error('Error: app is not a valid Express application');
  console.error('app type:', typeof app);
  console.error('app:', app);
  process.exit(1);
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
