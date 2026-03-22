/**
 * Manual test script for authentication endpoints
 * Run with: node test-auth.js
 */

const BASE_URL = 'http://localhost:3000';

// Test data - you'll need a real Orange ID token to test
const TEST_TOKEN = 'orange-mkfy4hja2n';
const TEST_REFRESH_TOKEN = 'your-refresh-token-here';

async function testVerifyEndpoint() {
  console.log('\n🧪 Testing GET /api/auth/verify...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Verify endpoint successful');
      console.log('User:', data.user);
    } else {
      console.log('❌ Verify endpoint failed');
      console.log('Error:', data);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

async function testRefreshEndpoint() {
  console.log('\n🧪 Testing POST /api/auth/refresh...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: TEST_REFRESH_TOKEN,
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Refresh endpoint successful');
      console.log('New tokens:', data);
    } else {
      console.log('❌ Refresh endpoint failed');
      console.log('Error:', data);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

async function testLogoutEndpoint() {
  console.log('\n🧪 Testing POST /api/auth/logout...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Logout endpoint successful');
      console.log('Response:', data);
    } else {
      console.log('❌ Logout endpoint failed');
      console.log('Error:', data);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

async function testProtectedRouteWithoutToken() {
  console.log('\n🧪 Testing protected route without token...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Protected route correctly rejected unauthorized request');
      console.log('Error:', data);
    } else {
      console.log('❌ Protected route should have returned 401');
      console.log('Response:', data);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting authentication endpoint tests...');
  console.log('⚠️  Note: You need to replace TEST_TOKEN and TEST_REFRESH_TOKEN with real Orange ID tokens');
  
  // Test protected route without token first
  await testProtectedRouteWithoutToken();
  
  // These tests require real tokens
  if (TEST_TOKEN !== 'your-orange-id-token-here') {
    await testVerifyEndpoint();
    await testLogoutEndpoint();
  } else {
    console.log('\n⚠️  Skipping token-based tests - please provide real tokens');
  }
  
  if (TEST_REFRESH_TOKEN !== 'your-refresh-token-here') {
    await testRefreshEndpoint();
  }
  
  console.log('\n✨ Tests completed');
}

runTests();
