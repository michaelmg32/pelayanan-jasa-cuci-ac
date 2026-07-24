
// ===== REGION GROUPS & ACCESSIBLE REGIONS =====

// Get accessible regions for current user (used for cross-region switching)
app.get('/api/accessible-regions', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'keuangan') {
    return res.json([]); 
  }
  if (!req.user.region_id) {
    return res.json([]);
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT r2.id, r2.name 
      FROM regions r1 
      JOIN regions r2 ON r1.group_id = r2.group_id 
      WHERE r1.id = ? AND r1.group_id IS NOT NULL
      ORDER BY r2.name ASC
    `, [req.user.region_id]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// CRUD for region_groups (Owner Pusat only)
app.get('/api/region-groups', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner' || req.user.region_id) {
    return res.status(403).json({ error: 'Akses ditolak' });
  }
  let connection;
  try {
    connection = await pool.getConnection();
    const [groups] = await connection.query('SELECT * FROM region_groups ORDER BY created_at DESC');
    for (let group of groups) {
      const [regions] = await connection.query('SELECT id, name FROM regions WHERE group_id = ?', [group.id]);
      group.regions = regions;
    }
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

app.post('/api/region-groups', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner' || req.user.region_id) {
    return res.status(403).json({ error: 'Akses ditolak' });
  }
  const { name, region_ids } = req.body;
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const [result] = await connection.query('INSERT INTO region_groups (name) VALUES (?)', [name]);
    const groupId = result.insertId;
    
    if (region_ids && region_ids.length > 0) {
      const placeholders = region_ids.map(() => '?').join(',');
      await connection.query(`UPDATE regions SET group_id = ? WHERE id IN (${placeholders})`, [groupId, ...region_ids]);
    }
    
    await connection.commit();
    res.json({ success: true, id: groupId });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

app.put('/api/region-groups/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner' || req.user.region_id) {
    return res.status(403).json({ error: 'Akses ditolak' });
  }
  const groupId = req.params.id;
  const { name, region_ids } = req.body;
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    if (name) {
      await connection.query('UPDATE region_groups SET name = ? WHERE id = ?', [name, groupId]);
    }
    
    // Reset all regions in this group
    await connection.query('UPDATE regions SET group_id = NULL WHERE group_id = ?', [groupId]);
    
    // Set new regions
    if (region_ids && region_ids.length > 0) {
      const placeholders = region_ids.map(() => '?').join(',');
      await connection.query(`UPDATE regions SET group_id = ? WHERE id IN (${placeholders})`, [groupId, ...region_ids]);
    }
    
    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

app.delete('/api/region-groups/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner' || req.user.region_id) {
    return res.status(403).json({ error: 'Akses ditolak' });
  }
  const groupId = req.params.id;
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    await connection.query('UPDATE regions SET group_id = NULL WHERE group_id = ?', [groupId]);
    await connection.query('DELETE FROM region_groups WHERE id = ?', [groupId]);
    
    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});
