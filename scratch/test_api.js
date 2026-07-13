import mysql from 'mysql2/promise';

async function testMySalary() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'sugarac.com',
      user: 'u990824557_sugar_ac',
      password: 'THEpied123@',
      database: 'u990824557_sugar_ac'
    });

    // 1. Get a valid karyawan ID
    const [karyawans] = await connection.query('SELECT id FROM users WHERE role="karyawan" LIMIT 1');
    if (karyawans.length === 0) {
      console.log('No karyawan found!');
      return;
    }
    const userId = karyawans[0].id;
    console.log('Testing with userId:', userId);

    const now = new Date();
    const localDate = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const currentMonthStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}`;

    console.log('Executing Query 1...');
    const [users] = await connection.query(`
      SELECT u.id, u.name, u.is_leader, u.points_balance, u.salary_balance, sg.leader_daily_base_salary, sg.leader_daily_travel_allowance, sg.leader_point_reward,
             sg.member_daily_base_salary, sg.member_daily_travel_allowance, sg.member_point_reward
      FROM users u
      LEFT JOIN staff_grades sg ON u.grade_id = sg.id
      WHERE u.id = ?
    `, [userId]);

    if (users.length === 0) {
      console.log('User tidak ditemukan');
      return;
    }
    const user = users[0];

    console.log('Executing Query 2...');
    const [orders] = await connection.query(`
      SELECT o.id, o.completedAt as completed_at, o.acDetail
      FROM orders o
      WHERE (o.workerId = ? OR o.id IN (SELECT order_id FROM order_assignments WHERE user_id = ?))
        AND o.status = 'SELESAI'
        AND DATE_FORMAT(o.completedAt, '%Y-%m') = ?
    `, [userId, userId, currentMonthStr]);

    let totalAc = 0;
    const workedDaysSet = new Set();

    orders.forEach(o => {
      if (o.completed_at) {
        workedDaysSet.add(new Date(o.completed_at).toISOString().split('T')[0]);
      }
      try {
        if (o.acDetail) {
          const detail = typeof o.acDetail === 'string' ? JSON.parse(o.acDetail) : o.acDetail;
          const items = Array.isArray(detail) ? detail : [detail];
          items.forEach(item => {
            if (item.serviceType !== 'none') {
              totalAc += (Number(item.quantity) || 1);
            }
          });
        }
      } catch (e) {}
    });

    const daysWorked = workedDaysSet.size;
    let dailyBase = 0, dailyTravel = 0, pointReward = 0;
    if (user.is_leader) {
      dailyBase = Number(user.leader_daily_base_salary) || 0;
      dailyTravel = Number(user.leader_daily_travel_allowance) || 0;
      pointReward = Number(user.leader_point_reward) || 0;
    } else {
      dailyBase = Number(user.member_daily_base_salary) || 0;
      dailyTravel = Number(user.member_daily_travel_allowance) || 0;
      pointReward = Number(user.member_point_reward) || 0;
    }

    const projectedBase = dailyBase * daysWorked;
    const projectedTravel = dailyTravel * daysWorked;
    const projectedPoints = pointReward * totalAc;

    console.log('Executing Query 3...');
    const [claims] = await connection.query('SELECT * FROM claims WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [userId]);

    const result = {
      success: true,
      data: {
        points_balance: user.points_balance || 0,
        salary_balance: user.salary_balance || 0,
        days_worked: daysWorked,
        total_ac_serviced: totalAc,
        projected_base_salary: projectedBase,
        projected_travel_allowance: projectedTravel,
        projected_total_salary: projectedBase + projectedTravel,
        projected_points: projectedPoints,
        daily_base_salary: dailyBase, // for backward compatibility
        daily_travel_allowance: dailyTravel,
        point_reward: pointReward,
        claims: claims
      }
    };
    
    console.log('Success! Final result:', result);

  } catch (error) {
    console.error('Error occurred:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

testMySalary();
