const mysql = require('mysql2/promise');

async function fixRoles() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'pelayanan_cuci_ac'
    });

    console.log('Connected to DB');

    // Find users with empty string roles
    const [emptyRoles] = await connection.execute("SELECT id, name, role FROM users WHERE role = ''");
    console.log('Users with empty roles:', emptyRoles);

    // Update them to 'pelanggan' (default) if any
    const [updateResult] = await connection.execute("UPDATE users SET role = 'pelanggan' WHERE role = ''");
    console.log(`Updated ${updateResult.affectedRows} users with empty roles to 'pelanggan'`);

    // Let's also check if any are 'USER' or 'STAFF' strings stored incorrectly, 
    // though ENUM would have rejected them and made them ''
    const [allUsers] = await connection.execute("SELECT id, name, role FROM users");
    console.log('All users current roles:', allUsers);

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixRoles();
