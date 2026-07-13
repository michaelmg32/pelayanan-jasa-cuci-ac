import mysql from 'mysql2/promise';

async function createTable() {
  try {
    const connection = await mysql.createConnection({
      host: 'sugarac.com',
      user: 'u990824557_sugar_ac',
      password: 'THEpied123@',
      database: 'u990824557_sugar_ac'
    });
    
    console.log('Creating order_assignments table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(50) NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_order (order_id),
        INDEX idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    console.log('Table created successfully!');
    await connection.end();
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

createTable();
