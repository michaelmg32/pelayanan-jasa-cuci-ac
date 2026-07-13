import fetch from 'node-fetch';

async function testLiveApi() {
  try {
    const login = await fetch('https://sugarac.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '081234567891', password: 'password123' })
    });
    const loginData = await login.json();
    console.log('Login:', loginData);
    
    if (loginData.token) {
      const res = await fetch('https://sugarac.com/api/staff/team', {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
      });
      const text = await res.text();
      console.log('Live Team API Response:', text.substring(0, 500));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

testLiveApi();
