const mysql = require('mysql2/promise');
async function run() {
  const pool = mysql.createPool({ 
    host: 'sugarac.com', 
    user: 'u990824557_sugar_ac', 
    password: 'THEpied123@', 
    database: 'u990824557_sugar_ac',
    dateStrings: true
  });
  
  await pool.query('UPDATE users SET last_monthly_salary_paid = NULL WHERE id = "user-2"');

  const wibDateObj = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
  const dateNum = wibDateObj.getDate();
  const currentMonthStr = `${wibDateObj.getFullYear()}-${String(wibDateObj.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
  
  const pad = (n) => String(n).padStart(2, '0');
  const exactWibString = `${wibDateObj.getFullYear()}-${pad(wibDateObj.getMonth()+1)}-${pad(wibDateObj.getDate())} ${pad(wibDateObj.getHours())}:${pad(wibDateObj.getMinutes())}:${pad(wibDateObj.getSeconds())}`;
  
  const [eligibleUsers] = await pool.query(`
    SELECT u.id, u.name, u.is_leader, u.monthly_salary_date,
           sg.leader_monthly_base_salary, sg.leader_monthly_travel_allowance,
           sg.member_monthly_base_salary, sg.member_monthly_travel_allowance
    FROM users u
    LEFT JOIN staff_grades sg ON u.grade_id = sg.id
    WHERE u.salary_type = 'monthly' 
      AND u.monthly_salary_date IS NOT NULL
      AND u.monthly_salary_date <= ?
      AND (u.last_monthly_salary_paid IS NULL OR DATE_FORMAT(u.last_monthly_salary_paid, '%Y-%m') != ?)
  `, [dateNum, currentMonthStr]);

  for (const st of eligibleUsers) {
    const base = st.is_leader ? (Number(st.leader_monthly_base_salary) || 0) : (Number(st.member_monthly_base_salary) || 0);
    const travel = st.is_leader ? (Number(st.leader_monthly_travel_allowance) || 0) : (Number(st.member_monthly_travel_allowance) || 0);
    const total = base + travel;
    
    if (total > 0) {
      await pool.query(
        'UPDATE users SET salary_balance = salary_balance + ?, last_monthly_salary_paid = ? WHERE id = ?',
        [total, exactWibString, st.id]
      );
      
      await pool.query(
        'INSERT INTO monthly_salary_history (user_id, amount, notes, created_at) VALUES (?, ?, ?, ?)',
        [st.id, total, `Gaji Pokok & Uang Jalan Bulanan (${currentMonthStr}) BULLETPROOF`, exactWibString]
      );
      console.log(`Processed ${st.name} at ${exactWibString}`);
    }
  }
  
  console.log('Done!');
  process.exit(0);
}
run();
