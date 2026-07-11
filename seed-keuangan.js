import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pelayanan_cuci_ac',
});

const seedPassword = '$2b$10$IyJaHTB1.yDO9P07X1GcRuWPSvYDmBH.SJbxzS0IuAV/WttH6uSY6'; // password123 hashed

async function seedKeuangan() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('🌱 Seeding regions, keuangan user, and dummy assets...');

    // 1. Insert Regions
    await connection.query('INSERT IGNORE INTO regions (id, name) VALUES (?, ?), (?, ?)', [
      'reg-bandung', 'Cabang Bandung',
      'reg-jakarta', 'Cabang Jakarta'
    ]);
    console.log('✅ Regions seeded');

    // 2. Insert Keuangan User
    await connection.query('DELETE FROM users WHERE email = ?', ['keuangan@example.com']);
    await connection.query(
      `INSERT INTO users (id, name, email, phone, role, password, region_id, status) VALUES 
       (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'user-5', 'Andi Keuangan', 'keuangan@example.com', '08987654321', 'keuangan', seedPassword, 'reg-bandung', 'active'
      ]
    );
    console.log('✅ Keuangan user keuangan@example.com (password123) seeded');

    // 3. Assign existing users to regions to prevent empty list views
    await connection.query('UPDATE users SET region_id = ? WHERE email = ?', ['reg-bandung', 'admin@example.com']);
    await connection.query('UPDATE users SET region_id = ? WHERE email = ?', ['reg-bandung', 'ahmad@example.com']);
    console.log('✅ Assigned Admin & Staff dummy users to Cabang Bandung');

    // 4. Insert Dummy Fixed Assets
    await connection.query('DELETE FROM fixed_assets WHERE region_id = ?', ['reg-bandung']);
    await connection.query(
      `INSERT INTO fixed_assets (region_id, name, purchase_date, purchase_price, description) VALUES 
       (?, ?, ?, ?, ?),
       (?, ?, ?, ?, ?),
       (?, ?, ?, ?, ?)`,
      [
        'reg-bandung', 'Gedung Ruko Operasional', '2025-01-15', 750000000, 'Ruko 2 lantai kantor cabang operasional Bandung',
        'reg-bandung', 'Motor Operasional Honda Revo', '2025-06-20', 16500000, 'Kendaraan operasional teknisi keliling',
        'reg-bandung', 'Mesin Steam Jet NL-90 NLG', '2026-03-10', 3200000, 'Mesin steam cuci AC tekanan tinggi NLG NL-90'
      ]
    );
    console.log('✅ Fixed assets seeded');

    // 5. Update ac_addons with region_id and seed dummy stock transactions
    await connection.query('UPDATE ac_addons SET region_id = ? WHERE region_id IS NULL', ['reg-bandung']);
    
    // Clear transactions first to prevent key conflicts
    await connection.query('DELETE FROM ac_addon_transactions');
    
    // Seed initial stock-in transactions
    await connection.query(
      `INSERT INTO ac_addon_transactions (addonId, type, qty, price, notes) VALUES 
       (?, 'masuk', ?, ?, ?),
       (?, 'masuk', ?, ?, ?),
       (?, 'masuk', ?, ?, ?)`,
      [
        'addon-1', 50, 20000, 'Restock awal desinfektan',
        'addon-2', 30, 150000, 'Restock awal refill freon',
        'addon-3', 25, 30000, 'Restock awal pembersihan indoor coil'
      ]
    );
    console.log('✅ Addon transactions/stocks seeded');

    console.log('\n🎉 Keuangan seeding completed successfully!');
    console.log('🔑 Akun Keuangan Baru:');
    console.log('   Email: keuangan@example.com');
    console.log('   Password: password123');
    console.log('   Wilayah: Cabang Bandung');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

seedKeuangan();
