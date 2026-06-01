const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key-change-in-production-env';
const token = jwt.sign(
  { id: 'user-3', email: 'admin@example.com', role: 'admin' },
  JWT_SECRET,
  { expiresIn: '24h' }
);

const API_BASE = 'http://127.0.0.1:5001/api';

async function run() {
  console.log('Testing order sync, stock deduction, and margin lock...');

  // 1. Fetch current stock of addon-1
  const resGetAddons = await fetch(`${API_BASE}/addons`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const addons = await resGetAddons.json();
  const addon1 = addons.find(a => a.id === 'addon-1');
  const initialStock = addon1.stock;
  const initialHpp = Number(addon1.hpp);
  console.log(`Initial stock of addon-1: ${initialStock} units, HPP: ${initialHpp}`);

  // 2. Create order
  const orderId = `test_order_${Date.now()}`;
  console.log(`Creating a test order ${orderId} (pending)...`);
  const resCreateOrder = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: orderId,
      customerId: 'user-1',
      customerName: 'Budi Santoso',
      customerPhone: '0812345678',
      address: 'Alamat Test',
      status: 'MENUNGGU',
      serviceCost: 150000,
      addonsCost: 100000,
      totalPrice: 250000,
      totalCost: 150000,
      serviceIds: ['svc-1'],
      addonIds: ['addon-1'],
      acDetail: { acType: 'Split Unit 1.5PK', category: 'Pembersihan AC', serviceType: 'Cuci AC Rutin', quantity: 1 }
    })
  });

  if (!resCreateOrder.ok) {
    console.error('Order creation failed:', await resCreateOrder.text());
    process.exit(1);
  }

  // Check stock after order creation (should be unchanged because status is not completed)
  const resAddonsAfterCreate = await fetch(`${API_BASE}/addons`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const addonsAfterCreate = await resAddonsAfterCreate.json();
  const addon1AfterCreate = addonsAfterCreate.find(a => a.id === 'addon-1');
  console.log(`Stock after order creation (status pending): ${addon1AfterCreate.stock} (expected: ${initialStock})`);

  // 3. Simulating technician submitting addonsUsed
  console.log('Simulating technician submitting addonsUsed...');
  const addonsUsed = [
    { id: 'addon-1', name: 'Desinfektan', price: 50000, quantity: 2 } // HPP is NOT provided, it should be auto-locked using current HPP
  ];

  const resUpdateOrder = await fetch(`${API_BASE}/orders/${orderId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: 'PAYMENT',
      addonsUsed: addonsUsed
    })
  });

  if (!resUpdateOrder.ok) {
    console.error('Order update failed:', await resUpdateOrder.text());
    process.exit(1);
  }

  // 4. Transition order to SELESAI (Completed)
  console.log('Simulating payment approval (status -> SELESAI)...');
  const resCompleteOrder = await fetch(`${API_BASE}/orders/${orderId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: 'SELESAI',
      paymentStatus: 'PAID'
    })
  });

  if (!resCompleteOrder.ok) {
    console.error('Order completion failed:', await resCompleteOrder.text());
    process.exit(1);
  }
  const completedOrder = await resCompleteOrder.json();

  // 5. Verify stock deduction
  const resAddonsAfterComplete = await fetch(`${API_BASE}/addons`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const addonsAfterComplete = await resAddonsAfterComplete.json();
  const addon1AfterComplete = addonsAfterComplete.find(a => a.id === 'addon-1');
  console.log(`Stock after order completion: ${addon1AfterComplete.stock} (expected: ${initialStock - 2})`);
  if (addon1AfterComplete.stock === initialStock - 2) {
    console.log('✅ Stock successfully deducted!');
  } else {
    console.log('❌ Stock deduction failed!');
  }

  // 6. Verify HPP locked in order addonsUsed
  const orderAddonsUsed = completedOrder.addonsUsed;
  const lockedHpp = orderAddonsUsed?.[0]?.hpp;
  console.log(`Locked HPP inside order addonsUsed: ${lockedHpp} (expected HPP: ${initialHpp})`);
  if (Number(lockedHpp) === initialHpp) {
    console.log('✅ HPP successfully locked/frozen in order JSON!');
  } else {
    console.log('❌ HPP lock failed!');
  }

  console.log(`Order HPP Total: ${completedOrder.hpp_orders}, Order Margin: ${completedOrder.margin}`);
  if (Number(completedOrder.hpp_orders) === initialHpp * 2 && Number(completedOrder.margin) === (150000 + 100000) - (initialHpp * 2)) {
    console.log('✅ Order margin calculated correctly based on locked HPP!');
  } else {
    console.log('❌ Order margin calculation error!');
  }

  // 7. Revert / Cancel the order
  console.log('Cancelling the order (updating status to DIBATALKAN)...');
  const resCancelOrder = await fetch(`${API_BASE}/orders/${orderId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: 'DIBATALKAN'
    })
  });

  if (!resCancelOrder.ok) {
    console.error('Order cancellation failed:', await resCancelOrder.text());
    process.exit(1);
  }

  // Verify stock restoration
  const resAddonsAfterCancel = await fetch(`${API_BASE}/addons`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const addonsAfterCancel = await resAddonsAfterCancel.json();
  const addon1AfterCancel = addonsAfterCancel.find(a => a.id === 'addon-1');
  console.log(`Stock after order cancellation: ${addon1AfterCancel.stock} (expected: ${initialStock})`);
  if (addon1AfterCancel.stock === initialStock) {
    console.log('✅ Stock successfully restored!');
  } else {
    console.log('❌ Stock restoration failed!');
  }
}

run().catch(console.error);
