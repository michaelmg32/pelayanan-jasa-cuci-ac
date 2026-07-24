import mysql from 'mysql2/promise';

async function migrate() {
  try {
    const conn = await mysql.createConnection({
      host: 'sugarac.com',
      user: 'u990824557_sugar_ac',
      password: 'THEpied123@',
      database: 'u990824557_sugar_ac'
    });
    await conn.query('CREATE TABLE IF NOT EXISTS region_groups (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
    console.log('Created region_groups table');
    try {
      await conn.query('ALTER TABLE regions ADD COLUMN group_id INT DEFAULT NULL');
      console.log('Added group_id to regions');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('group_id already exists');
      else throw e;
    }
    await conn.end();
  } catch (e) {
    console.error(e);
  }
}
migrate();
