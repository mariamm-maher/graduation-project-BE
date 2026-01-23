require('dotenv').config();
const http = require('http');
const app = require('./app');
const initializeSocket = require('./config/socket');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);

// Make io accessible globally (optional, for use in other files if needed)
app.set('io', io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Server is running at ${url}`);
  console.log(`Socket.io is ready for real-time connections`);
});
