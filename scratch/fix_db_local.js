import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function createTableLocal() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'pelayanan_cuci_ac'
    });
    
    console.log('Creating order_assignments table in local DB...');
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
    
    console.log('Local table created successfully!');
    await connection.end();
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

createTableLocal();
