import fetch from 'node-fetch';

async function testApi() {
  try {
    const login = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '081234567891', password: 'password123' })
    });
    const loginData = await login.json();
    console.log('Login:', loginData);
    
    if (loginData.token) {
      const res = await fetch('http://localhost:3000/api/staff/team', {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
      });
      const text = await res.text();
      console.log('Team API Response:', text);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

testApi();
