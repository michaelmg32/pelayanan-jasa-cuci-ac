const mysql = require('mysql2/promise');

async function addAddress() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'pelayanan_cuci_ac'
    });

    console.log('Connected to DB');

    await connection.execute("ALTER TABLE users ADD COLUMN address TEXT");
    console.log('Added address column to users table.');

    await connection.end();
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column address already exists.');
    } else {
      console.error('Error:', error);
    }
  }
}

addAddress();
