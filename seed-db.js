import mysql from 'mysql2/promise';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pelayanan_cuci_ac',
});

const seedPassword = '$2b$10$IyJaHTB1.yDO9P07X1GcRuWPSvYDmBH.SJbxzS0IuAV/WttH6uSY6'; // password123 hashed

async function seedDatabase() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    console.log('🌱 Starting database seeding...');
    
    // Clear existing users
    await connection.query('DELETE FROM users');
    console.log('✅ Cleared existing users');
    
    // Insert new users with hashed passwords
    await connection.query(
      `INSERT INTO users (id, name, email, phone, role, password) VALUES 
       (?, ?, ?, ?, ?, ?),
       (?, ?, ?, ?, ?, ?),
       (?, ?, ?, ?, ?, ?),
       (?, ?, ?, ?, ?, ?)`,
      [
        'user-1', 'Budi Santoso', 'budi@example.com', '0812345678', 'pelanggan', seedPassword,
        'user-2', 'Ahmad Riyanto', 'ahmad@example.com', '0812345679', 'karyawan', seedPassword,
        'user-3', 'Admin User', 'admin@example.com', '0812345680', 'admin', seedPassword,
        'user-4', 'Owner Business', 'owner@example.com', '0812345681', 'owner', seedPassword,
      ]
    );
    console.log('✅ Inserted users with hashed passwords');
    
    // Verify
    const [users] = await connection.query('SELECT id, name, email, role FROM users');
    console.log('✅ Users in database:');
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.role})`);
    });
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log('📝 Test credentials (password123):');
    console.log('   Admin: admin@example.com');
    console.log('   Customer: budi@example.com');
    console.log('   Staff: ahmad@example.com');
    console.log('   Owner: owner@example.com');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

seedDatabase();
