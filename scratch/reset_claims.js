import mysql from 'mysql2/promise';

async function resetClaims() {
  try {
    const connection = await mysql.createConnection({
      host: 'sugarac.com',
      user: 'u990824557_sugar_ac',
      password: 'THEpied123@',
      database: 'u990824557_sugar_ac'
    });
    
    await connection.query('DELETE FROM claims WHERE status = "pending"');
    await connection.query('UPDATE users SET points_balance = 4, salary_balance = 140000 WHERE id = "user-2"');
    console.log('Reset successful!');
    
    await connection.end();
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

resetClaims();
