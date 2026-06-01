const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pelayanan_cuci_ac',
});

async function main() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to database');
    
    const [rows] = await connection.query('SELECT * FROM settings');
    console.log('Current settings in DB:');
    console.log(rows);
    
    connection.release();
  } catch (err) {
    console.error('❌ Database error:', err);
  }
  process.exit(0);
}

main();
