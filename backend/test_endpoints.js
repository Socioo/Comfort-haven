require('dotenv').config();

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
let authToken = '';

const endpoints = [
  // Auth
  { method: 'POST', path: '/auth/signup', body: { email: 'test_script@example.com', password: 'password123', name: 'Test User', role: 'user' }, isLogin: true },
  { method: 'POST', path: '/auth/login', body: { email: 'test_script@example.com', password: 'password123' }, isLogin: true },
  { method: 'GET', path: '/auth/profile', auth: true },
  { method: 'PATCH', path: '/auth/profile', body: { name: 'Updated Name' }, auth: true },
  
  // Users
  { method: 'GET', path: '/users' },
  { method: 'GET', path: '/users/00000000-0000-0000-0000-000000000001' },
  
  // Properties
  { method: 'GET', path: '/properties' },
  { method: 'GET', path: '/properties/00000000-0000-0000-0000-000000000001' },
  { method: 'POST', path: '/properties/search', body: { location: 'New York' } },
  
  // Bookings
  { method: 'GET', path: '/bookings', auth: true },
  { method: 'GET', path: '/bookings/00000000-0000-0000-0000-000000000001', auth: true },
  
  // Reviews
  { method: 'GET', path: '/reviews/property/00000000-0000-0000-0000-000000000001' },
  
  // Favorites
  { method: 'GET', path: '/favorites', auth: true },
  { method: 'GET', path: '/favorites/00000000-0000-0000-0000-000000000001/check', auth: true },
  
  // Messages
  { method: 'GET', path: '/messages/inbox', auth: true },
  
  // Stats
  { method: 'GET', path: '/stats', auth: true }
];

async function runTests() {
  console.log(`Starting API Tests against ${BASE_URL}...\n`);
  
  for (const endpoint of endpoints) {
    const url = `${BASE_URL}${endpoint.path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(endpoint.auth && authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
    };
    
    const options = {
      method: endpoint.method,
      headers: headers,
      ...(endpoint.body ? { body: JSON.stringify(endpoint.body) } : {})
    };

    try {
      const response = await fetch(url, options);
      const isSuccess = response.ok;
      
      console.log(`[${isSuccess ? 'PASS' : 'FAIL'}] ${endpoint.method} ${endpoint.path} -> Status: ${response.status}`);
      
      let responseData = null;
      try {
         responseData = await response.json();
      } catch(e) {
         // Some endpoints might return empty bodies (like 204 or certain errors)
      }

      if (!isSuccess && response.status !== 401 && response.status !== 404 && response.status !== 409) {
          console.log(`       Error: ${JSON.stringify(responseData)}`);
      }

      if (endpoint.isLogin && isSuccess && responseData) {
        const extractedToken = responseData.accessToken || responseData.token || (responseData.data && responseData.data.accessToken);

        if (extractedToken) {
          authToken = extractedToken;
          console.log(`       -> Successfully extracted auth token.`);
        } else {
            console.log(`       -> Failed to extract auth token. Response data: ${JSON.stringify(responseData)}`);
        }
      }
    } catch (error) {
      console.log(`[ERROR] ${endpoint.method} ${endpoint.path} -> ${error.message}`);
    }
  }
  
  console.log('\nTesting Complete.');
}

runTests().catch(console.error);
