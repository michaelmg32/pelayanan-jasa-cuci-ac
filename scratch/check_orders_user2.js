import mysql from 'mysql2/promise';

async function checkOrders() {
  try {
    const connection = await mysql.createConnection({
      host: 'sugarac.com',
      user: 'u990824557_sugar_ac',
      password: 'THEpied123@',
      database: 'u990824557_sugar_ac'
    });
    
    const [orders] = await connection.query('SELECT id, workerId, status, completedAt, acDetail FROM orders WHERE workerId = "user-2"');
    console.log(JSON.stringify(orders, null, 2));
    
    await connection.end();
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

checkOrders();
