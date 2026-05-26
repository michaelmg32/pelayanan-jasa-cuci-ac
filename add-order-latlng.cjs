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

    await connection.execute("ALTER TABLE orders ADD COLUMN lat DOUBLE, ADD COLUMN lng DOUBLE");
    console.log('Added lat and lng columns to orders table.');

    await connection.end();
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns lat/lng already exist in orders table.');
    } else {
      console.error('Error:', error);
    }
  }
}

migrate();
