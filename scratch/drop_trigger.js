import mysql from 'mysql2/promise';

async function dropTrigger() {
  try {
    const connection = await mysql.createConnection({
      host: 'sugarac.com',
      user: 'u990824557_sugar_ac',
      password: 'THEpied123@',
      database: 'u990824557_sugar_ac'
    });
    
    await connection.query('DROP TRIGGER IF EXISTS after_order_complete');
    console.log('Successfully dropped old trigger!');
    
    // Also reset the test user's balance back to the correct state (140.000 and 4 points)
    // Wait, the second order HAD 1 AC. So they should have:
    // First order: 1 AC, First of day -> +140.000, +2 points
    // Second order: 1 AC, Not first of day -> +0, +2 points
    // Total should be: 140.000 salary, 4 points!
    await connection.query('UPDATE users SET points_balance = 4, salary_balance = 140000 WHERE id = "user-2"');
    console.log('Reset user to 140.000 and 4 points!');
    
    await connection.end();
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

dropTrigger();
