import mysql from 'mysql2/promise';

async function testQuery() {
  try {
    const connection = await mysql.createConnection({
      host: 'sugarac.com',
      user: 'u990824557_sugar_ac',
      password: 'THEpied123@',
      database: 'u990824557_sugar_ac'
    });
    
    const [res] = await connection.query(`
      SELECT COUNT(*) as cnt 
      FROM orders o
      WHERE o.workerId = 'user-2' 
        AND o.status = 'SELESAI' 
        AND DATE(o.completedAt) = CURDATE() 
        AND o.id != 'ORD-260713-XCG2'
    `);
    console.log('Count:', res[0].cnt);
    
    const [res2] = await connection.query(`
      SELECT o.id, o.completedAt, DATE(o.completedAt), CURDATE()
      FROM orders o
      WHERE o.workerId = 'user-2' AND o.status = 'SELESAI'
    `);
    console.log('Raw:', res2);
    
    await connection.end();
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

testQuery();
