import fs from 'fs';

let content = fs.readFileSync('server.js', 'utf8');

const targetIdx = content.indexOf("app.put('/api/staff/assign-team'");
if (targetIdx !== -1) {
  const endIdx = content.indexOf("});", targetIdx);
  if (endIdx !== -1) {
    const oldBlock = content.substring(targetIdx, endIdx + 3);
    const newBlock = `app.put('/api/staff/assign-team', verifyToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const user = req.user;
    const roleLower = user.role?.toLowerCase();
    if (roleLower !== 'keuangan' && roleLower !== 'owner') {
      return res.status(403).json({ error: 'Akses ditolak.' });
    }
    
    const { grade_id, leader_id, member_ids = [] } = req.body;
    if (!grade_id || !leader_id) {
      return res.status(400).json({ error: 'grade_id dan leader_id diperlukan.' });
    }

    await connection.beginTransaction();
    
    // 1. Bersihkan semua orang yang sebelumnya berada di grade/tim ini
    await connection.query('UPDATE users SET grade_id = NULL, is_leader = 0, leader_id = NULL WHERE grade_id = ?', [grade_id]);
    
    // 2. Set Leader baru untuk tim ini
    await connection.query('UPDATE users SET grade_id = ?, is_leader = 1, leader_id = NULL WHERE id = ?', [grade_id, leader_id]);
    
    // 3. Set Member baru untuk tim ini
    if (member_ids.length > 0) {
      const placeholders = member_ids.map(() => '?').join(',');
      await connection.query(\`UPDATE users SET grade_id = ?, is_leader = 0, leader_id = ? WHERE id IN (\${placeholders})\`, [grade_id, leader_id, ...member_ids]);
    }
    
    await connection.commit();
    res.json({ success: true, message: 'Tim berhasil ditugaskan.' });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});`;
    content = content.replace(oldBlock, newBlock);
    fs.writeFileSync('server.js', content);
    console.log('Successfully updated assign-team logic in server.js');
  } else {
    console.log('Could not find end of assign-team block');
  }
} else {
  console.log('Could not find assign-team in server.js');
}
