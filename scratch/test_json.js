import mysql from 'mysql2/promise';

async function testOrders() {
  try {
    const connection = await mysql.createConnection({
      host: 'sugarac.com',
      user: 'u990824557_sugar_ac',
      password: 'THEpied123@',
      database: 'u990824557_sugar_ac'
    });
    
    console.log('Fetching orders...');
    const [orders] = await connection.query('SELECT id, acDetail FROM orders');
    let hasError = false;
    orders.forEach(order => {
      if (order.acDetail) {
        try {
          JSON.parse(order.acDetail);
        } catch (e) {
          console.error(`Order ${order.id} has invalid acDetail:`, order.acDetail);
          hasError = true;
        }
      }
    });

    if (!hasError) console.log('All acDetail fields are valid JSON!');

    // Also check my-salary again just to be sure
    const currentMonthStr = '2026-07'; // Match current month
    const userId = 'user-2';
    
    const [myOrders] = await connection.query(`
      SELECT o.id, o.completedAt as completed_at, o.acDetail
      FROM orders o
      WHERE (o.workerId = ? OR o.id IN (SELECT order_id FROM order_assignments WHERE user_id = ?))
        AND o.status = 'SELESAI'
        AND DATE_FORMAT(o.completedAt, '%Y-%m') = ?
    `, [userId, userId, currentMonthStr]);
    
    myOrders.forEach(o => {
       if (o.acDetail) {
           try {
             JSON.parse(o.acDetail);
           } catch(e) {
             console.log(`MySalary Order ${o.id} invalid json`);
           }
       }
    });

    await connection.end();
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

testOrders();
