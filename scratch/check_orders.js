import mysql from 'mysql2/promise';

async function checkSchema() {
  try {
    const connection = await mysql.createConnection({
      host: 'sugarac.com',
      user: 'u990824557_sugar_ac',
      password: 'THEpied123@',
      database: 'u990824557_sugar_ac'
    });
    
    const [cols] = await connection.execute('SHOW COLUMNS FROM orders');
    console.log(cols.filter(c => c.Field === 'completedAt'));
    await connection.end();
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

checkSchema();
