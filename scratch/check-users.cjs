const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pelayanan_cuci_ac'
  });

  const [rows] = await connection.query("SELECT id, name, email, role FROM users");
  console.log("Users in DB:", rows);
  await connection.end();
}

run().catch(console.error);
