const API_BASE = 'http://127.0.0.1:5001/api';

async function run() {
  console.log('Testing login endpoint locally with password123...');
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@example.com',
      password: 'password123'
    })
  });

  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response:', data);
}

run().catch(console.error);
