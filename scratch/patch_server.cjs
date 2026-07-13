const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, '..', 'server.js');
let content = fs.readFileSync(serverFile, 'utf8');

// 1. Add completedAt = NOW()
const target1 = `    if (status !== undefined) { updateFields.push('status = ?'); updateValues.push(status); }`;
const replacement1 = `    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
      if (status === 'SELESAI') {
        updateFields.push('completedAt = NOW()');
      }
    }`;

if (content.includes(target1)) {
  content = content.replace(target1, replacement1);
  console.log('✅ Replaced target 1 (completedAt)');
} else {
  console.log('❌ Target 1 not found');
}

// 2. Add Auto-Increment Logic
const target2 = `        if ((statusBecameDitugaskan || workerChanged) && order.workerId) {
          sendWorkerNotification(id, order.workerId).catch(err => console.error('Error sending Fonnte worker notification:', err));
        }
      }

      const parsedOrder = {`;

const replacement2 = `        if ((statusBecameDitugaskan || workerChanged) && order.workerId) {
          sendWorkerNotification(id, order.workerId).catch(err => console.error('Error sending Fonnte worker notification:', err));
        }
      }

      // -------------------------------------------------------------
      // AUTO-INCREMENT SALARY & POINTS BALANCE
      // -------------------------------------------------------------
      if (oldOrder && order.status === 'SELESAI' && oldOrder.status !== 'SELESAI') {
        try {
          const workerIds = [];
          if (order.workerId) workerIds.push(order.workerId);
          
          const [assignments] = await connection.query('SELECT user_id FROM order_assignments WHERE order_id = ?', [id]);
          assignments.forEach(a => {
            if (a.user_id && !workerIds.includes(a.user_id)) {
              workerIds.push(a.user_id);
            }
          });

          for (const wId of workerIds) {
            const [users] = await connection.query(\`
              SELECT u.is_leader, sg.leader_point_reward, sg.member_point_reward,
                     sg.leader_daily_base_salary, sg.leader_daily_travel_allowance,
                     sg.member_daily_base_salary, sg.member_daily_travel_allowance
              FROM users u
              LEFT JOIN staff_grades sg ON u.grade_id = sg.id
              WHERE u.id = ?
            \`, [wId]);

            if (users.length > 0) {
              const user = users[0];
              
              let totalAc = 0;
              if (order.acDetail) {
                try {
                  const detail = typeof order.acDetail === 'string' ? JSON.parse(order.acDetail) : order.acDetail;
                  const items = Array.isArray(detail) ? detail : [detail];
                  items.forEach(item => {
                    if (item.serviceType !== 'none') totalAc += (Number(item.quantity) || 1);
                  });
                } catch (e) {}
              }
              const pointReward = user.is_leader ? (Number(user.leader_point_reward) || 0) : (Number(user.member_point_reward) || 0);
              const pointsEarned = pointReward * totalAc;

              let salaryEarned = 0;
              const [completedToday] = await connection.query(\`
                SELECT COUNT(*) as cnt 
                FROM orders o
                LEFT JOIN order_assignments oa ON o.id = oa.order_id
                WHERE (o.workerId = ? OR oa.user_id = ?) 
                  AND o.status = 'SELESAI' 
                  AND DATE(o.completedAt) = CURDATE() 
                  AND o.id != ?
              \`, [wId, wId, order.id]);

              if (completedToday[0].cnt === 0) {
                const dailyBase = user.is_leader ? (Number(user.leader_daily_base_salary) || 0) : (Number(user.member_daily_base_salary) || 0);
                const dailyTravel = user.is_leader ? (Number(user.leader_daily_travel_allowance) || 0) : (Number(user.member_daily_travel_allowance) || 0);
                salaryEarned = dailyBase + dailyTravel;
              }

              if (pointsEarned > 0 || salaryEarned > 0) {
                await connection.query(\`
                  UPDATE users 
                  SET points_balance = points_balance + ?, salary_balance = salary_balance + ? 
                  WHERE id = ?
                \`, [pointsEarned, salaryEarned, wId]);
                console.log(\`✅ Added \${pointsEarned} points and \${salaryEarned} salary for worker \${wId} on order \${id}\`);
              }
            }
          }
        } catch (err) {
          console.error('Error updating salary/points balance:', err);
        }
      }
      // -------------------------------------------------------------

      const parsedOrder = {`;

if (content.includes(target2)) {
  content = content.replace(target2, replacement2);
  console.log('✅ Replaced target 2 (Auto Increment Logic)');
} else {
  console.log('❌ Target 2 not found');
}

fs.writeFileSync(serverFile, content, 'utf8');
console.log('Done.');
