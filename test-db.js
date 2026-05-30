import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pelayanan_cuci_ac',
});

async function main() {
  console.log('Database Config:', {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    database: process.env.DB_NAME || 'pelayanan_cuci_ac',
  });
  
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to database successfully');
    
    // Check total orders count
    const [total] = await connection.query('SELECT COUNT(*) as count FROM orders');
    console.log('Total orders in DB:', total[0].count);
    
    // Check completed orders
    const [completed] = await connection.query('SELECT id, customerName, customerPhone, status, completedAt, reminderSent FROM orders WHERE status = "SELESAI"');
    console.log('Completed orders in DB:', completed.length);
    
    // Check if any order is eligible for 3-month reminder
    const [eligible] = await connection.query(
      `SELECT id, customerName, customerPhone, completedAt, reminderSent FROM orders 
       WHERE status = 'SELESAI' 
         AND reminderSent = 0 
         AND completedAt <= DATE_SUB(NOW(), INTERVAL 90 DAY)`
    );
    console.log('Eligible orders for reminder (>= 90 days ago):', eligible.length);
    console.log(eligible);
    
    connection.release();
  } catch (err) {
    console.error('❌ Database error:', err);
  }
  process.exit(0);
}

main();
