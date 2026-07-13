import mysql from 'mysql2/promise';

async function checkAdmin() {
  const connection = await mysql.createConnection({
    host: 'sugarac.com', user: 'u990824557_sugar_ac', password: 'THEpied123@', database: 'u990824557_sugar_ac'
  });
  const [users] = await connection.query("SELECT id, email, role, region_id FROM users WHERE email = 'admin@sugarac.com'");
  console.log("Admin user:", users[0]);
  
  const [regions] = await connection.query("SELECT id, name FROM regions");
  console.log("All regions:", regions);
  
  connection.end();
}
checkAdmin();
