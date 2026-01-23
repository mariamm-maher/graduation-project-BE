/**
 * Socket.io Chat Testing Script
 * 
 * Usage:
 * 1. Make sure the server is running
 * 2. Replace YOUR_ACCESS_TOKEN with a valid JWT token
 * 3. Replace CHAT_ID with an existing chat ID
 * 4. Run: node test-socket.js
 */

const io = require('socket.io-client');

// Configuration
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN';
const CHAT_ID = process.env.CHAT_ID || 1;

console.log('🚀 Starting Socket.io Chat Test...\n');
console.log(`Server: ${SERVER_URL}`);
console.log(`Chat ID: ${CHAT_ID}\n`);

// Connect to server
const socket = io(SERVER_URL, {
  auth: {
    token: ACCESS_TOKEN
  },
  transports: ['websocket', 'polling']
});

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected to server');
  console.log(`Socket ID: ${socket.id}\n`);
  
  // Join the chat room
  console.log(`Joining chat ${CHAT_ID}...`);
  socket.emit('join_chat', { chatId: CHAT_ID });
});

socket.on('disconnect', (reason) => {
  console.log(`❌ Disconnected: ${reason}`);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  if (error.message.includes('Authentication')) {
    console.error('💡 Tip: Make sure your ACCESS_TOKEN is valid');
  }
});

// Chat events
socket.on('joined_chat', (data) => {
  console.log(`✅ Joined chat: ${data.chatId}\n`);
});

socket.on('left_chat', (data) => {
  console.log(`👋 Left chat: ${data.chatId}`);
});

socket.on('unread_count', (data) => {
  console.log(`📬 Unread messages in chat ${data.chatId}: ${data.count}`);
});

// Message events
socket.on('new_message', (data) => {
  console.log('\n📨 New message received:');
  console.log(`   Chat ID: ${data.chatId}`);
  console.log(`   From: ${data.message.sender.firstName} ${data.message.sender.lastName}`);
  console.log(`   Content: ${data.message.content}`);
  console.log(`   Time: ${new Date(data.message.createdAt).toLocaleString()}\n`);
});

socket.on('message_sent', (data) => {
  console.log('✅ Message sent successfully');
  console.log(`   Content: ${data.message.content}\n`);
});

// Typing indicator
socket.on('user_typing', (data) => {
  const status = data.isTyping ? 'typing...' : 'stopped typing';
  console.log(`⌨️  ${data.userName} is ${status}`);
});

// Error handling
socket.on('error', (error) => {
  console.error('❌ Socket error:', error.message || error);
});

// Test functions
function sendTestMessage() {
  const message = `Test message at ${new Date().toLocaleTimeString()}`;
  console.log(`\n📤 Sending message: "${message}"`);
  socket.emit('send_message', {
    chatId: CHAT_ID,
    content: message
  });
}

function testTypingIndicator() {
  console.log('\n⌨️  Testing typing indicator...');
  socket.emit('typing', { chatId: CHAT_ID, isTyping: true });
  
  setTimeout(() => {
    socket.emit('typing', { chatId: CHAT_ID, isTyping: false });
    console.log('✅ Typing indicator test completed\n');
  }, 3000);
}

function testMarkRead() {
  console.log('\n📖 Marking messages as read...');
  socket.emit('mark_read', { chatId: CHAT_ID });
}

// Run tests after connection
socket.on('joined_chat', () => {
  // Wait a bit, then send test message
  setTimeout(() => {
    sendTestMessage();
  }, 1000);
  
  // Test typing indicator
  setTimeout(() => {
    testTypingIndicator();
  }, 3000);
  
  // Test mark as read
  setTimeout(() => {
    testMarkRead();
  }, 6000);
  
  // Send another message after 8 seconds
  setTimeout(() => {
    sendTestMessage();
  }, 8000);
  
  // Exit after 10 seconds
  setTimeout(() => {
    console.log('\n✅ Test completed. Exiting...');
    socket.disconnect();
    process.exit(0);
  }, 10000);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down...');
  socket.disconnect();
  process.exit(0);
});


