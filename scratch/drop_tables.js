import mysql from 'mysql2/promise';

async function dropTables() {
  try {
    const connection = await mysql.createConnection({
      host: 'sugarac.com',
      user: 'u990824557_sugar_ac',
      password: 'THEpied123@',
      database: 'u990824557_sugar_ac'
    });
    
    await connection.query('DROP TABLE IF EXISTS salary_records');
    await connection.query('DROP TABLE IF EXISTS staff_salary_configs');
    console.log('Successfully dropped old salary tables!');
    
    await connection.end();
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

dropTables();
