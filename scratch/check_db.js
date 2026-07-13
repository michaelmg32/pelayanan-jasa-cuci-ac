import mysql from 'mysql2/promise';

async function checkDb() {
  try {
    const host = 'sugarac.com';
    const user = 'u990824557_sugar_ac';
    const password = 'THEpied123@';
    const database = 'u990824557_sugar_ac';

    console.log(`Connecting to ${host} with user ${user}...`);
    const connection = await mysql.createConnection({
      host: host,
      user: user,
      password: password,
      database: database,
      port: 3306 // default port
    });
    console.log('Connected to the database successfully.');
    
    const [rows, fields] = await connection.execute('SHOW TABLES');
    console.log('\nTables in database:');
    for (let row of rows) {
      console.log(`- ${Object.values(row)[0]}`);
    }

    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log(`\nNumber of users: ${users[0].count}`);

    await connection.end();
  } catch (error) {
    console.error('Database connection failed. Full error:', error.message);
  }
}

checkDb();
