const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key-change-in-production-env';
const token = jwt.sign(
  { id: 'user-3', email: 'admin@example.com', role: 'admin' },
  JWT_SECRET,
  { expiresIn: '24h' }
);

const API_BASE = 'http://127.0.0.1:5001/api';

async function run() {
  console.log('Testing addon purchase and HPP calculations...');

  // 1. Fetch initial state
  const resGetInit = await fetch(`${API_BASE}/addons`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!resGetInit.ok) {
    console.error('Failed to get addons:', await resGetInit.text());
    process.exit(1);
  }
  const addonsInit = await resGetInit.json();
  const addon1 = addonsInit.find(a => a.id === 'addon-1');
  console.log('Before Purchase:', {
    name: addon1.name,
    stock: addon1.stock,
    hpp: Number(addon1.hpp),
    price: Number(addon1.price)
  });

  // 2. Perform purchase
  console.log('Sending purchase request: 20 units @ Rp25.000...');
  const resPurchase = await fetch(`${API_BASE}/addons/purchase`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      addonId: 'addon-1',
      qty: 20,
      price: 25000,
      notes: 'Test purchase COGS script'
    })
  });

  if (!resPurchase.ok) {
    console.error('Purchase failed:', await resPurchase.text());
    process.exit(1);
  }
  const purchaseResult = await resPurchase.json();
  console.log('Purchase Response:', purchaseResult);

  // 3. Fetch final state
  const resGetFinal = await fetch(`${API_BASE}/addons`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const addonsFinal = await resGetFinal.json();
  const addon1Final = addonsFinal.find(a => a.id === 'addon-1');
  console.log('After Purchase:', {
    name: addon1Final.name,
    stock: addon1Final.stock,
    hpp: Number(addon1Final.hpp),
    price: Number(addon1Final.price)
  });

  // 4. Calculate expected
  const currentStock = addon1.stock;
  const currentHpp = Number(addon1.hpp);
  const purchaseQty = 20;
  const purchasePrice = 25000;
  let expectedHpp = purchasePrice;
  if (currentStock > 0) {
    expectedHpp = ((currentStock * currentHpp) + (purchaseQty * purchasePrice)) / (currentStock + purchaseQty);
  }
  expectedHpp = Math.round(expectedHpp * 100) / 100;

  console.log('Expected HPP:', expectedHpp);
  console.log('Actual HPP in DB:', Number(addon1Final.hpp));
  if (Math.abs(expectedHpp - Number(addon1Final.hpp)) < 0.05) {
    console.log('✅ HPP moving average matches expectations!');
  } else {
    console.log('❌ HPP moving average mismatch!');
  }
}

run().catch(console.error);
