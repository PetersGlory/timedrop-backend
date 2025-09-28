/**
 * Test script for Flutterwave webhook implementation with JWT
 * This script helps test the webhook endpoint locally
 */

const jwt = require('jsonwebtoken');
const axios = require('axios');

// Configuration
const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/flutterwave';
const JWT_SECRET = process.env.FLUTTERWAVE_SECRET_KEY || process.env.JWT_SECRET || 'your_jwt_secret_here';

// Sample webhook payloads
const samplePayloads = {
  transferCompleted: {
    type: 'transfer.completed',
    data: {
      id: '123456789',
      amount: 1000,
      currency: 'NGN',
      status: 'successful',
      reference: 'TD-test-123456789-WD',
      complete_message: 'Transfer completed successfully',
      account_number: '1234567890',
      bank_name: 'Test Bank'
    }
  },
  transferFailed: {
    type: 'transfer.failed',
    data: {
      id: '123456790',
      amount: 500,
      currency: 'NGN',
      status: 'failed',
      reference: 'TD-test-123456790-WD',
      complete_message: 'Transfer failed - insufficient funds',
      account_number: '0987654321',
      bank_name: 'Test Bank'
    }
  },
  chargeCompleted: {
    type: 'charge.completed',
    data: {
      id: '123456791',
      amount: 2000,
      currency: 'NGN',
      status: 'successful',
      tx_ref: 'TD-deposit-123456791',
      payment_type: 'card',
      customer: {
        email: 'test@example.com',
        phone_number: '+2341234567890'
      }
    }
  }
};

/**
 * Generate JWT token for webhook
 */
function generateJWT(payload, secret) {
  return jwt.sign(payload, secret, { 
    expiresIn: '1h',
    issuer: 'flutterwave',
    audience: 'timedrop-backend'
  });
}

/**
 * Test webhook endpoint
 */
async function testWebhook(payload, eventType) {
  try {
    console.log(`\n🧪 Testing ${eventType}...`);
    
    const token = generateJWT(payload, JWT_SECRET);
    
    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`✅ ${eventType} - Status: ${response.status}`);
    console.log(`📝 Response:`, response.data);
    
  } catch (error) {
    console.error(`❌ ${eventType} - Error:`, error.response?.data || error.message);
  }
}

/**
 * Test invalid JWT token
 */
async function testInvalidToken() {
  try {
    console.log('\n🧪 Testing invalid JWT token...');
    
    const payload = samplePayloads.transferCompleted;
    const invalidToken = 'invalid.jwt.token';
    
    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${invalidToken}`
      }
    });
    
    console.log('❌ Should have failed with invalid token');
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Invalid token correctly rejected - Status: 401');
    } else {
      console.error('❌ Unexpected error:', error.response?.data || error.message);
    }
  }
}

/**
 * Test missing token
 */
async function testMissingToken() {
  try {
    console.log('\n🧪 Testing missing token...');
    
    const payload = samplePayloads.transferCompleted;
    
    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
        // No Authorization header
      }
    });
    
    console.log('❌ Should have failed with missing token');
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Missing token correctly rejected - Status: 401');
    } else {
      console.error('❌ Unexpected error:', error.response?.data || error.message);
    }
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting Flutterwave Webhook Tests (JWT)');
  console.log('===========================================');
  console.log(`📡 Webhook URL: ${WEBHOOK_URL}`);
  console.log(`🔐 JWT Secret: ${JWT_SECRET.substring(0, 8)}...`);
  
  // Test valid webhooks
  await testWebhook(samplePayloads.transferCompleted, 'Transfer Completed');
  await testWebhook(samplePayloads.transferFailed, 'Transfer Failed');
  await testWebhook(samplePayloads.chargeCompleted, 'Charge Completed');
  
  // Test security
  await testInvalidToken();
  await testMissingToken();
  
  console.log('\n✨ Tests completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Check your server logs for webhook processing details');
  console.log('2. Verify database updates in your application');
  console.log('3. Check email notifications if configured');
  console.log('4. NOTE: This JWT implementation may not work with actual Flutterwave webhooks');
  console.log('5. Flutterwave uses HMAC-SHA256 signatures, not JWT tokens');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testWebhook,
  generateJWT,
  samplePayloads
};
