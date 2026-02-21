const path = require('path');
require('dotenv').config();
const http = require('http');
const app = require('./app');


// Create HTTP server
const server = http.createServer(app);



// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Server is running at ${url}`);
});
