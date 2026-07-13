import mysql from 'mysql2/promise';

async function checkUsers() {
  try {
    const host = 'sugarac.com';
    const user = 'u990824557_sugar_ac';
    const password = 'THEpied123@';
    const database = 'u990824557_sugar_ac';

    const connection = await mysql.createConnection({
      host, user, password, database
    });
    
    const [columns] = await connection.execute('DESCRIBE users');
    console.log('Columns in users table:');
    for (let col of columns) {
      console.log(`- ${col.Field} (${col.Type})`);
    }

    const [salaryConfigs] = await connection.execute('DESCRIBE staff_salary_configs');
    console.log('\nColumns in staff_salary_configs table:');
    for (let col of salaryConfigs) {
      console.log(`- ${col.Field} (${col.Type})`);
    }

    await connection.end();
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

checkUsers();
