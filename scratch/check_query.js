import mysql from 'mysql2/promise';

async function checkMySalaryQuery() {
  try {
    const connection = await mysql.createConnection({
      host: 'sugarac.com',
      user: 'u990824557_sugar_ac',
      password: 'THEpied123@',
      database: 'u990824557_sugar_ac'
    });
    
    console.log('Testing Query 1 (Users & Grades):');
    try {
      const [users] = await connection.query(`
        SELECT u.id, u.name, u.is_leader, u.points_balance, u.salary_balance, sg.leader_daily_base_salary, sg.leader_daily_travel_allowance, sg.leader_point_reward,
               sg.member_daily_base_salary, sg.member_daily_travel_allowance, sg.member_point_reward
        FROM users u
        LEFT JOIN staff_grades sg ON u.grade_id = sg.id
        LIMIT 1
      `);
      console.log('Query 1 Success!', users);
    } catch (e) {
      console.error('Query 1 Failed:', e.message);
    }

    console.log('\nTesting Query 2 (Orders):');
    try {
      const userId = 'some-dummy-id';
      const currentMonthStr = '2026-07';
      const [orders] = await connection.query(`
        SELECT o.id, o.completedAt as completed_at, o.acDetail
        FROM orders o
        WHERE (o.workerId = ? OR o.id IN (SELECT order_id FROM order_assignments WHERE user_id = ?))
          AND o.status = 'SELESAI'
          AND DATE_FORMAT(o.completedAt, '%Y-%m') = ?
      `, [userId, userId, currentMonthStr]);
      console.log('Query 2 Success!');
    } catch (e) {
      console.error('Query 2 Failed:', e.message);
    }

    await connection.end();
  } catch (error) {
    console.error('Connection failed:', error.message);
  }
}

checkMySalaryQuery();
