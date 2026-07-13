const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'pelayanan_cuci_ac'
};

async function main() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    // 1. Check/Insert region Palembang
    const [regions] = await connection.query('SELECT * FROM regions WHERE name = ?', ['Palembang']);
    let regionId;
    if (regions.length > 0) {
      regionId = regions[0].id;
      console.log(`Region Palembang already exists: ${regionId}`);
    } else {
      regionId = 'reg_' + Date.now();
      await connection.query('INSERT INTO regions (id, name) VALUES (?, ?)', [regionId, 'Palembang']);
      console.log(`Region Palembang created: ${regionId}`);
    }

    // 2. Create finance user
    const email = 'keuangan.palembang@example.com';
    const name = 'Keuangan Palembang';
    const rawPassword = 'password123';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const userId = 'user_fi_' + Date.now();

    // Check if user already exists
    const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length > 0) {
      await connection.query(
        'UPDATE users SET name = ?, password = ?, role = ?, region_id = ? WHERE email = ?',
        [name, hashedPassword, 'keuangan', regionId, email]
      );
      console.log(`Finance user updated: ${email} (Password: ${rawPassword})`);
    } else {
      await connection.query(
        'INSERT INTO users (id, name, email, role, password, region_id) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, name, email, 'keuangan', hashedPassword, regionId]
      );
      console.log(`Finance user created: ${email} (Password: ${rawPassword})`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

main();
