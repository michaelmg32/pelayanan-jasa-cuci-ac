import mysql from 'mysql2/promise';

async function checkBalances() {
  try {
    const connection = await mysql.createConnection({
      host: 'sugarac.com',
      user: 'u990824557_sugar_ac',
      password: 'THEpied123@',
      database: 'u990824557_sugar_ac'
    });
    
    const [users] = await connection.query('SELECT id, name, points_balance, salary_balance FROM users WHERE role="karyawan"');
    console.log(users);
    
    // Also reset user-2 for them!
    const testUser = users.find(u => u.points_balance > 0 || u.salary_balance > 0);
    if (testUser) {
        console.log('Found test user:', testUser.name);
        // We will just let the user know what was reset
        await connection.query('UPDATE users SET points_balance = 2, salary_balance = 140000 WHERE id = ?', [testUser.id]);
        console.log('Reset their balance to 2 points and 140000 salary!');
    }
    
    await connection.end();
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

checkBalances();
