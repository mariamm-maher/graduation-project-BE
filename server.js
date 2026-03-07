//server.js
const path = require('path');
require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initializeSocket } = require('./socket');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`🚀 Server is running at ${url}`);
  console.log(`📚 Swagger docs: ${url}/api-docs`);
  console.log(`🔌 WebSocket server ready`);
});