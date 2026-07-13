import mysql from 'mysql2/promise';

async function checkGrades() {
  try {
    const connection = await mysql.createConnection({
      host: 'sugarac.com',
      user: 'u990824557_sugar_ac',
      password: 'THEpied123@',
      database: 'u990824557_sugar_ac'
    });
    
    const [grades] = await connection.query('SELECT * FROM staff_grades');
    console.log(grades);
    
    await connection.end();
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

checkGrades();
