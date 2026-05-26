const mysql = require('mysql2/promise');

async function migrate() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'pelayanan_cuci_ac'
    });

    console.log('Connected to DB');

    // Add lat and lng columns to users table
    await connection.execute("ALTER TABLE users ADD COLUMN lat DOUBLE, ADD COLUMN lng DOUBLE");
    console.log('Added lat and lng columns to users table.');

    await connection.end();
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns lat/lng already exist.');
    } else {
      console.error('Error:', error);
    }
  }
}

migrate();
