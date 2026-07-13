import mysql from 'mysql2/promise';

async function checkClaims() {
  try {
    const connection = await mysql.createConnection({
      host: 'sugarac.com',
      user: 'u990824557_sugar_ac',
      password: 'THEpied123@',
      database: 'u990824557_sugar_ac'
    });
    
    const [claims] = await connection.query('SELECT * FROM claims');
    console.log(claims);
    
    await connection.end();
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

checkClaims();
