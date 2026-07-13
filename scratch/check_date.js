import mysql from 'mysql2/promise';

async function checkDate() {
  try {
    const connection = await mysql.createConnection({
      host: 'sugarac.com',
      user: 'u990824557_sugar_ac',
      password: 'THEpied123@',
      database: 'u990824557_sugar_ac'
    });
    
    const [rows] = await connection.query('SELECT CURDATE() as curdate, NOW() as now');
    console.log(rows[0]);
    
    await connection.end();
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

checkDate();
