import mysql from 'mysql2/promise';

async function checkTriggers() {
  try {
    const connection = await mysql.createConnection({
      host: 'sugarac.com',
      user: 'u990824557_sugar_ac',
      password: 'THEpied123@',
      database: 'u990824557_sugar_ac'
    });
    
    const [triggers] = await connection.query('SHOW TRIGGERS');
    console.log(triggers);
    
    await connection.end();
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

checkTriggers();
