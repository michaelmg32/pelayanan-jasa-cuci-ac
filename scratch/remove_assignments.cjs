const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, '..', 'server.js');
let content = fs.readFileSync(serverFile, 'utf8');

// Replacements

const target1 = `          const workerIds = [];
          if (order.workerId) workerIds.push(order.workerId);
          
          const [assignments] = await connection.query('SELECT user_id FROM order_assignments WHERE order_id = ?', [id]);
          assignments.forEach(a => {
            if (a.user_id && !workerIds.includes(a.user_id)) {
              workerIds.push(a.user_id);
            }
          });

          for (const wId of workerIds) {`;
const replace1 = `          const workerIds = [];
          if (order.workerId) workerIds.push(order.workerId);

          for (const wId of workerIds) {`;

const target2 = `              const [completedToday] = await connection.query(\`
                SELECT COUNT(*) as cnt 
                FROM orders o
                LEFT JOIN order_assignments oa ON o.id = oa.order_id
                WHERE (o.workerId = ? OR oa.user_id = ?) 
                  AND o.status = 'SELESAI' 
                  AND DATE(o.completedAt) = CURDATE() 
                  AND o.id != ?
              \`, [wId, wId, order.id]);`;
const replace2 = `              const [completedToday] = await connection.query(\`
                SELECT COUNT(*) as cnt 
                FROM orders o
                WHERE o.workerId = ? 
                  AND o.status = 'SELESAI' 
                  AND DATE(o.completedAt) = CURDATE() 
                  AND o.id != ?
              \`, [wId, order.id]);`;

const target3 = `    const [orders] = await connection.query(\`
      SELECT o.id, o.completedAt as completed_at, o.acDetail
      FROM orders o
      WHERE (o.workerId = ? OR o.id IN (SELECT order_id FROM order_assignments WHERE user_id = ?))
        AND o.status = 'SELESAI'
        AND DATE_FORMAT(o.completedAt, '%Y-%m') = ?
    \`, [userId, userId, currentMonthStr]);`;
const replace3 = `    const [orders] = await connection.query(\`
      SELECT o.id, o.completedAt as completed_at, o.acDetail
      FROM orders o
      WHERE o.workerId = ?
        AND o.status = 'SELESAI'
        AND DATE_FORMAT(o.completedAt, '%Y-%m') = ?
    \`, [userId, currentMonthStr]);`;

const target4 = `        const [orders] = await connection.query(\`
        SELECT o.id, o.completedAt as completed_at, o.acDetail
        FROM orders o
        WHERE (o.workerId = ? OR o.id IN (SELECT order_id FROM order_assignments WHERE user_id = ?))
          AND o.status = 'SELESAI'
          AND DATE_FORMAT(o.completedAt, '%Y-%m') = ?
      \`, [member.id, member.id, currentMonthStr]);`;
const replace4 = `        const [orders] = await connection.query(\`
        SELECT o.id, o.completedAt as completed_at, o.acDetail
        FROM orders o
        WHERE o.workerId = ?
          AND o.status = 'SELESAI'
          AND DATE_FORMAT(o.completedAt, '%Y-%m') = ?
      \`, [member.id, currentMonthStr]);`;


if (content.includes(target1)) { content = content.replace(target1, replace1); console.log('1 replaced'); } else { console.log('1 missed'); }
if (content.includes(target2)) { content = content.replace(target2, replace2); console.log('2 replaced'); } else { console.log('2 missed'); }
if (content.includes(target3)) { content = content.replace(target3, replace3); console.log('3 replaced'); } else { console.log('3 missed'); }
if (content.includes(target4)) { content = content.replace(target4, replace4); console.log('4 replaced'); } else { console.log('4 missed'); }

fs.writeFileSync(serverFile, content, 'utf8');
console.log('Finished patching server.js');
