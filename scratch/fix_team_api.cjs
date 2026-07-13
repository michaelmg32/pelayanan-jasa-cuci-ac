const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'server.js');
let text = fs.readFileSync(file, 'utf8');

const target = `    const [members] = await connection.query(\`
      SELECT u.id, u.name, u.phone, u.status, sg.member_point_reward
      FROM users u
      LEFT JOIN staff_grades sg ON u.grade_id = sg.id
      WHERE u.leader_id = ?
    \`, [userId]);

    for (let member of members) {
      const [orders] = await connection.query(\`
        SELECT o.id, o.completedAt as completed_at, o.acDetail
        FROM orders o
        WHERE o.workerId = ?
          AND o.status = 'SELESAI'
          AND DATE_FORMAT(o.completedAt, '%Y-%m') = ?
      \`, [member.id, currentMonthStr]);

      let totalAc = 0;
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
      });

      member.total_ac_serviced = totalAc;
      member.projected_points = (Number(member.member_point_reward) || 0) * totalAc;
    }

    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
});`;

const replacement = `    const [members] = await connection.query(\`
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
});`;

if (text.includes(target)) {
    text = text.replace(target, replacement);
    fs.writeFileSync(file, text);
    console.log('Replaced team performance API successfully');
} else {
    console.log('Could not find the target string');
}
