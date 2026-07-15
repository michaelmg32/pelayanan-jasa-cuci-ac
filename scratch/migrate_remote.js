import mysql from 'mysql2/promise';

async function migrateRemoteDb() {
  try {
    const host = 'sugarac.com';
    const user = 'u990824557_sugar_ac';
    const password = 'THEpied123@';
    const database = 'u990824557_sugar_ac';

    console.log(`Connecting to ${host} with user ${user}...`);
    const connection = await mysql.createConnection({
      host: host,
      user: user,
      password: password,
      database: database,
      port: 3306
    });
    console.log('Connected successfully. Running migrations...');

    // 1. Migrate staff_grades
    const monthlyCols = ['leader_monthly_base_salary', 'leader_monthly_travel_allowance', 'member_monthly_base_salary', 'member_monthly_travel_allowance'];
    for (const col of monthlyCols) {
      const [colCheck] = await connection.query(`SHOW COLUMNS FROM staff_grades LIKE '${col}'`);
      if (colCheck.length === 0) {
        await connection.query(`ALTER TABLE staff_grades ADD COLUMN ${col} DECIMAL(10,2) DEFAULT 0`);
        console.log(`✅ Added '${col}' column to 'staff_grades' table`);
      } else {
        console.log(`Column '${col}' already exists in 'staff_grades'.`);
      }
    }

    // 2. Migrate users
    const userMonthlyCols = [
      { name: 'salary_type', def: "VARCHAR(20) DEFAULT 'daily'" },
      { name: 'monthly_salary_date', def: "INT NULL" },
      { name: 'last_monthly_salary_paid', def: "DATE NULL" }
    ];
    for (const col of userMonthlyCols) {
      const [colCheck] = await connection.query(`SHOW COLUMNS FROM users LIKE '${col.name}'`);
      if (colCheck.length === 0) {
        await connection.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.def}`);
        console.log(`✅ Added '${col.name}' column to 'users' table`);
      } else {
        console.log(`Column '${col.name}' already exists in 'users'.`);
      }
    }

    console.log('\nMigration on remote database complete!');
    await connection.end();
  } catch (error) {
    console.error('Migration failed:', error.message);
  }
}

migrateRemoteDb();
