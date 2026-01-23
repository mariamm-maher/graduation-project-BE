/**
 * REST API Chat Testing Script
 *
 * Usage:
 * 1. Make sure the server is running
 * 2. Replace YOUR_ACCESS_TOKEN with a valid JWT token
 * 3. Replace USER_ID and INFLUENCER_ID with valid IDs
 * 4. Run: node test-api.js
 */

const http = require('http');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN';
const INFLUENCER_ID = process.env.INFLUENCER_ID || 2;

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testChatAPI() {
  console.log('🚀 Starting REST API Chat Tests...\n');
  console.log(`Server: ${BASE_URL}`);
  console.log(`Influencer ID: ${INFLUENCER_ID}\n`);

  try {
    // Test 1: Start a chat
    console.log('📝 Test 1: Starting a chat...');
    const startChat = await makeRequest('POST', '/api/chat/start', {
      influencerId: INFLUENCER_ID
    });
    console.log(`Status: ${startChat.status}`);
    console.log('Response:', JSON.stringify(startChat.data, null, 2));
    
    if (startChat.status !== 201 && startChat.status !== 200) {
      console.error('❌ Failed to start chat');
      return;
    }
    
    const chatId = startChat.data.data?.chat?.id;
    if (!chatId) {
      console.error('❌ No chat ID returned');
      return;
    }
    
    console.log(`✅ Chat created/retrieved with ID: ${chatId}\n`);

    // Test 2: Get all chats
    console.log('📋 Test 2: Getting all chats...');
    const getAllChats = await makeRequest('GET', '/api/chat');
    console.log(`Status: ${getAllChats.status}`);
    console.log(`Found ${getAllChats.data.data?.chats?.length || 0} chats\n`);

    // Test 3: Get chat by influencer name
    console.log('🔍 Test 3: Getting chat by influencer name...');
    const getByName = await makeRequest('GET', '/api/chat/Jane%20Smith');
    console.log(`Status: ${getByName.status}`);
    if (getByName.status === 200) {
      console.log('✅ Chat found by name\n');
    } else {
      console.log('ℹ️  Chat not found (this is OK if influencer name doesn\'t match)\n');
    }

    // Test 4: Send a message
    console.log('💬 Test 4: Sending a message...');
    const sendMessage = await makeRequest('POST', `/api/chat/${chatId}/messages`, {
      content: `Test message at ${new Date().toLocaleTimeString()}`
    });
    console.log(`Status: ${sendMessage.status}`);
    if (sendMessage.status === 201) {
      console.log('✅ Message sent successfully\n');
    } else {
      console.log('❌ Failed to send message\n');
    }

    // Test 5: Get messages
    console.log('📨 Test 5: Getting messages...');
    const getMessages = await makeRequest('GET', `/api/chat/${chatId}/messages?page=1&limit=10`);
    console.log(`Status: ${getMessages.status}`);
    if (getMessages.status === 200) {
      const messages = getMessages.data.data?.messages || [];
      console.log(`✅ Retrieved ${messages.length} messages\n`);
      if (messages.length > 0) {
        console.log('Latest message:');
        console.log(`  From: ${messages[messages.length - 1].sender.firstName}`);
        console.log(`  Content: ${messages[messages.length - 1].content}\n`);
      }
    }

    console.log('✅ All tests completed!\n');
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run tests
testChatAPI();



