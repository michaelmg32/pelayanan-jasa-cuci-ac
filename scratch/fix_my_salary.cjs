const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'server.js');

let text = fs.readFileSync(file, 'utf8');

const targetStr = `    const [claims] = await connection.query('SELECT * FROM claims WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [userId]);

    res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
});`;

const replacement = `    const [claims] = await connection.query('SELECT * FROM claims WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [userId]);

    const history = [];

    claims.forEach(c => {
      history.push({
        id: \`claim-\${c.id}\`,
        date: c.created_at,
        type: c.type === 'points' ? 'klaim_poin' : 'klaim_gaji',
        title: c.type === 'points' ? 'Penukaran Poin Bonus' : 'Pencairan Saldo Gaji',
        amount: c.type === 'points' ? -c.points_claimed : -c.amount,
        status: c.status,
        notes: c.notes || 'Pengajuan klaim'
      });
    });

    const ordersByDate = {};
    orders.forEach(o => {
      if (o.completed_at) {
        const d = new Date(o.completed_at).toISOString().split('T')[0];
        if (!ordersByDate[d]) ordersByDate[d] = [];
        ordersByDate[d].push(o);
      }
    });

    Object.keys(ordersByDate).forEach(dateStr => {
      const dayOrders = ordersByDate[dateStr];
      dayOrders.sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));
      
      const firstOrder = dayOrders[0];
      if (dailyBase > 0 || dailyTravel > 0) {
        history.push({
          id: \`salary-\${firstOrder.id}\`,
          date: firstOrder.completed_at,
          type: 'tambah_gaji',
          title: 'Gaji Pokok & Uang Jalan (Harian)',
          amount: dailyBase + dailyTravel,
          status: 'approved',
          notes: \`Penyelesaian Order #\${firstOrder.id}\`
        });
      }

      dayOrders.forEach(o => {
        let acCount = 0;
        try {
          if (o.acDetail) {
            const detail = typeof o.acDetail === 'string' ? JSON.parse(o.acDetail) : o.acDetail;
            const items = Array.isArray(detail) ? detail : [detail];
            items.forEach(item => {
              if (item.serviceType !== 'none') {
                acCount += (Number(item.quantity) || 1);
              }
            });
          }
        } catch(e) {}
        
        if (acCount > 0 && pointReward > 0) {
          history.push({
            id: \`points-\${o.id}\`,
            date: o.completed_at,
            type: 'tambah_poin',
            title: 'Bonus Poin Performa',
            amount: acCount * pointReward,
            status: 'approved',
            notes: \`Penyelesaian Order #\${o.id} (\${acCount} Unit AC)\`
          });
        }
      });
    });

    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: {
        points_balance: user.points_balance || 0,
        salary_balance: user.salary_balance || 0,
        claims: claims,
        history: history
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
});`;

text = text.replace(targetStr, replacement);
fs.writeFileSync(file, text);
console.log('Fixed my-salary endpoint.');
