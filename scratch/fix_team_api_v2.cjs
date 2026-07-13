const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'server.js');
let text = fs.readFileSync(file, 'utf8');

// We know the API starts with:
// // GET my team performance
// app.get('/api/staff/team', verifyToken, async (req, res) => {
// and ends right before:
// // 4. Request Claim

const startIdx = text.indexOf('// GET my team performance');
const endIdx = text.indexOf('// 4. Request Claim');

if (startIdx !== -1 && endIdx !== -1) {
    const newFunc = `// GET my team performance
app.get('/api/staff/team', verifyToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const userId = req.user.id;
    const now = new Date();
    const localDate = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const currentMonthStr = \`\${localDate.getFullYear()}-\${String(localDate.getMonth() + 1).padStart(2, '0')}\`;

    const [leaderCheck] = await connection.query('SELECT is_leader FROM users WHERE id = ?', [userId]);
    if (!leaderCheck.length || !leaderCheck[0].is_leader) {
      return res.status(403).json({ error: 'Bukan team leader.' });
    }

    const [members] = await connection.query(\`
      SELECT u.id, u.name, u.phone, u.status, sg.member_point_reward, u.points_balance
      FROM users u
      LEFT JOIN staff_grades sg ON u.grade_id = sg.id
      WHERE u.leader_id = ?
    \`, [userId]);

    for (let member of members) {
      const [orders] = await connection.query(\`
        SELECT o.id, o.completedAt as completed_at, o.acDetail, o.rating
        FROM orders o
        WHERE o.workerId = ?
          AND o.status = 'SELESAI'
          AND DATE_FORMAT(o.completedAt, '%Y-%m') = ?
      \`, [member.id, currentMonthStr]);

      let totalAc = 0;
      let totalRating = 0;
      let ratingCount = 0;
      orders.forEach(o => {
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
        if (o.rating && Number(o.rating) > 0) {
          totalRating += Number(o.rating);
          ratingCount++;
        }
      });

      member.total_ac_serviced = totalAc;
      member.points_balance = member.points_balance || 0;
      member.avg_rating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : '0.0';
    }

    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

`;

    text = text.substring(0, startIdx) + newFunc + text.substring(endIdx);
    fs.writeFileSync(file, text);
    console.log('Successfully replaced /api/staff/team logic');
} else {
    console.log('Could not find start or end block');
}
