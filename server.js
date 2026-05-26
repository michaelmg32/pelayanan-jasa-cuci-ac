import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production-env';
const JWT_EXPIRY = '24h';

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// JWT Verification Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pelayanan_cuci_ac',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test Database Connection
app.get('/api/test-connection', async (req, res) => {
  console.log('✅ Test connection endpoint called');
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connection successful');
    res.json({ status: 'Database connected successfully', timestamp: new Date().toISOString() });
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== AUTHENTICATION API =====
// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const connection = await pool.getConnection();
    const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
    connection.release();

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = users[0];
    
    // Verify password
    const passwordMatch = await bcryptjs.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Google Login endpoint
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  try {
    if (!credential) {
      return res.status(400).json({ error: 'Google credential required' });
    }

    // Verify Google Token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;
    
    const connection = await pool.getConnection();
    const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
    
    let user;
    if (users.length === 0) {
      // User doesn't exist, create them
      const newId = `usr_google_${Date.now()}`;
      
      // Generate dummy password for Google users
      const salt = await bcryptjs.genSalt(10);
      const dummyPassword = await bcryptjs.hash(Math.random().toString(36), salt);
      
      await connection.query(
        'INSERT INTO users (id, name, email, role, password) VALUES (?, ?, ?, ?, ?)',
        [newId, name, email, 'pelanggan', dummyPassword]
      );
      
      user = { id: newId, name, email, role: 'pelanggan' };
    } else {
      user = users[0];
    }
    
    connection.release();

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ error: 'Failed to authenticate with Google' });
  }
});

// Register endpoint (for customers)
app.post('/api/auth/register', async (req, res) => {
  const { id, name, email, phone, address, password, role } = req.body;
  try {
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name required' });
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const connection = await pool.getConnection();
    
    // Check if email already exists
    const [existingUsers] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Insert new user
    const newId = id || `usr_${Date.now()}`;
    await connection.query(
      'INSERT INTO users (id, name, email, phone, role, password) VALUES (?, ?, ?, ?, ?, ?)',
      [newId, name, email, phone || null, role || 'pelanggan', hashedPassword]
    );

    connection.release();

    // Generate JWT token
    const token = jwt.sign(
      { id: newId, email, role: role || 'pelanggan' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.status(201).json({
      token,
      user: {
        id: newId,
        name,
        email,
        phone: phone || null,
        role: role || 'pelanggan'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout endpoint (client-side should delete token from localStorage)
app.post('/api/auth/logout', verifyToken, (req, res) => {
  // Token is cleared on client-side
  res.json({ message: 'Logged out successfully' });
});

// ===== USERS API =====
app.get('/api/users', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.query('SELECT id, name, email, phone, role, createdAt FROM users');
    connection.release();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { id, name, email, phone, role, password } = req.body;
  try {
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name required' });
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const connection = await pool.getConnection();
    const userId = id || `usr_${Date.now()}`;
    await connection.query(
      'INSERT INTO users (id, name, email, phone, role, password) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, email, phone || null, role || 'pelanggan', hashedPassword]
    );
    connection.release();
    res.status(201).json({ id: userId, name, email, phone, role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, role, password, address } = req.body;
  try {
    const connection = await pool.getConnection();
    
    // Build update query dynamically based on provided fields
    let updateFields = [];
    let updateValues = [];
    
    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (phone) {
      updateFields.push('phone = ?');
      updateValues.push(phone || null);
    }
    if (role) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    if (password) {
      // If password is being updated, hash it
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(password, salt);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }
    
    if (address) {
      updateFields.push('address = ?');
      updateValues.push(address);
    }
    if (req.body.lat !== undefined) {
      updateFields.push('lat = ?');
      updateValues.push(req.body.lat);
    }
    if (req.body.lng !== undefined) {
      updateFields.push('lng = ?');
      updateValues.push(req.body.lng);
    }
    
    if (updateFields.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updateValues.push(id);
    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    
    await connection.query(updateQuery, updateValues);
    
    const [user] = await connection.query('SELECT id, name, email, phone, role, address, lat, lng FROM users WHERE id = ?', [id]);
    connection.release();
    
    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint khusus untuk update password
app.put('/api/users/:id/password', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body;
  
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Password lama dan baru harus diisi' });
  }

  try {
    const connection = await pool.getConnection();
    
    // Ambil user saat ini
    const [users] = await connection.query('SELECT password FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }
    
    const user = users[0];
    
    // Verifikasi password lama
    const passwordMatch = await bcryptjs.compare(oldPassword, user.password);
    if (!passwordMatch) {
      connection.release();
      return res.status(401).json({ error: 'Password lama tidak sesuai' });
    }
    
    // Hash password baru
    const salt = await bcryptjs.genSalt(10);
    const hashedNewPassword = await bcryptjs.hash(newPassword, salt);
    
    // Update ke database
    await connection.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, id]);
    
    connection.release();
    res.json({ message: 'Password berhasil diubah' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== ORDERS API =====
app.get('/api/orders', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [orders] = await connection.query('SELECT * FROM orders');
    connection.release();
    
    // Parse JSON fields and map workerId to assignedTo
    const parsedOrders = orders.map(order => ({
      ...order,
      assignedTo: order.workerId, // Map database field to API field
      acDetail: order.acDetail ? JSON.parse(order.acDetail) : null,
      serviceIds: order.serviceIds ? JSON.parse(order.serviceIds) : [],
      addonIds: order.addonIds ? JSON.parse(order.addonIds) : []
    }));
    
    res.json(parsedOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  const { 
    id, customerId, customerName, customerPhone, address, workerId, assignedEmployeeName,
    status, schedule, scheduledDate, scheduledTime, serviceIds, addonIds, acDetail, notes, 
    serviceCost, addonsCost, totalPrice, totalCost, photoBefore, photoAfter, 
    paymentMethod, paymentStatus, rating, ratingNotes, latitude, longitude
  } = req.body;
  
  try {
    const connection = await pool.getConnection();
    await connection.query(
      `INSERT INTO orders (
        id, customerId, customerName, customerPhone, address, workerId, assignedEmployeeName,
        status, schedule, scheduledDate, scheduledTime, serviceIds, addonIds, acDetail, notes,
        serviceCost, addonsCost, totalPrice, totalCost, photoBefore, photoAfter,
        paymentMethod, paymentStatus, rating, ratingNotes, latitude, longitude
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`,
      [
        id, customerId, customerName, customerPhone, address, workerId, assignedEmployeeName,
        status, schedule, scheduledDate, scheduledTime, 
        JSON.stringify(serviceIds), JSON.stringify(addonIds), JSON.stringify(acDetail), notes,
        serviceCost || 0, addonsCost || 0, totalPrice, totalCost,
        photoBefore, photoAfter, paymentMethod, paymentStatus, rating, ratingNotes, latitude, longitude
      ]
    );
    connection.release();
    res.status(201).json({ 
      id, 
      customerId, 
      customerName,
      customerPhone,
      address,
      workerId, 
      assignedEmployeeName,
      status, 
      schedule,
      scheduledDate,
      scheduledTime,
      serviceIds,
      addonIds,
      acDetail,
      notes,
      serviceCost,
      addonsCost,
      totalPrice,
      totalCost,
      photoBefore,
      photoAfter,
      paymentMethod,
      paymentStatus,
      rating,
      ratingNotes,
      latitude,
      longitude,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    status, workerId, assignedTo, assignedEmployeeName, notes, totalPrice, photoBefore, photoAfter, 
    paymentMethod, paymentStatus, rating, ratingNotes, acDetail, serviceCost, addonsCost, totalCost
  } = req.body;
  try {
    const connection = await pool.getConnection();
    
    // Support both workerId and assignedTo (assignedTo is the frontend name, workerId is the database name)
    const staffId = workerId || assignedTo;
    
    // Build dynamic update query
    let updateFields = [];
    let updateValues = [];
    
    if (status !== undefined) { updateFields.push('status = ?'); updateValues.push(status); }
    if (staffId !== undefined) { updateFields.push('workerId = ?'); updateValues.push(staffId); }
    if (assignedEmployeeName !== undefined) { updateFields.push('assignedEmployeeName = ?'); updateValues.push(assignedEmployeeName); }
    if (notes !== undefined) { updateFields.push('notes = ?'); updateValues.push(notes); }
    if (totalPrice !== undefined) { updateFields.push('totalPrice = ?'); updateValues.push(totalPrice); }
    if (photoBefore !== undefined) { updateFields.push('photoBefore = ?'); updateValues.push(photoBefore); }
    if (photoAfter !== undefined) { updateFields.push('photoAfter = ?'); updateValues.push(photoAfter); }
    if (paymentMethod !== undefined) { updateFields.push('paymentMethod = ?'); updateValues.push(paymentMethod); }
    if (paymentStatus !== undefined) { updateFields.push('paymentStatus = ?'); updateValues.push(paymentStatus); }
    if (rating !== undefined) { updateFields.push('rating = ?'); updateValues.push(rating); }
    if (ratingNotes !== undefined) { updateFields.push('ratingNotes = ?'); updateValues.push(ratingNotes); }
    if (acDetail !== undefined) { updateFields.push('acDetail = ?'); updateValues.push(JSON.stringify(acDetail)); }
    if (serviceCost !== undefined) { updateFields.push('serviceCost = ?'); updateValues.push(serviceCost); }
    if (addonsCost !== undefined) { updateFields.push('addonsCost = ?'); updateValues.push(addonsCost); }
    if (totalCost !== undefined) { updateFields.push('totalCost = ?'); updateValues.push(totalCost); }
    
    updateFields.push('updatedAt = NOW()');
    updateValues.push(id);
    
    if (updateFields.length > 1) {
      await connection.query(
        `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }
    
    const [updatedOrder] = await connection.query('SELECT * FROM orders WHERE id = ?', [id]);
    connection.release();
    
    if (updatedOrder.length > 0) {
      const order = updatedOrder[0];
      const parsedOrder = {
        ...order,
        acDetail: order.acDetail ? JSON.parse(order.acDetail) : null,
        serviceIds: order.serviceIds ? JSON.parse(order.serviceIds) : [],
        addonIds: order.addonIds ? JSON.parse(order.addonIds) : []
      };
      res.json(parsedOrder);
    } else {
      res.json(req.body);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== AC MODELS API =====
app.get('/api/models', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [models] = await connection.query('SELECT * FROM ac_models');
    connection.release();
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/models', async (req, res) => {
  const { id, name, manufacturer } = req.body;
  try {
    const connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO ac_models (id, name, manufacturer) VALUES (?, ?, ?)',
      [id, name, manufacturer]
    );
    connection.release();
    res.status(201).json({ id, name, manufacturer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/models/:id', async (req, res) => {
  const { id } = req.params;
  const { name, manufacturer } = req.body;
  try {
    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE ac_models SET name = ?, manufacturer = ? WHERE id = ?',
      [name, manufacturer, id]
    );
    const [model] = await connection.query('SELECT * FROM ac_models WHERE id = ?', [id]);
    connection.release();
    res.json(model[0] || { id, name, manufacturer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== AC CATEGORIES API =====
app.get('/api/categories', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [categories] = await connection.query('SELECT * FROM ac_categories');
    connection.release();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', async (req, res) => {
  const { id, name, description } = req.body;
  try {
    const connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO ac_categories (id, name, description) VALUES (?, ?, ?)',
      [id, name, description]
    );
    connection.release();
    res.status(201).json({ id, name, description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE ac_categories SET name = ?, description = ? WHERE id = ?',
      [name, description, id]
    );
    const [category] = await connection.query('SELECT * FROM ac_categories WHERE id = ?', [id]);
    connection.release();
    res.json(category[0] || { id, name, description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== AC SERVICES API =====
app.get('/api/services', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [services] = await connection.query('SELECT * FROM ac_services');
    connection.release();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services', async (req, res) => {
  const { id, name, description, basePrice, price, duration } = req.body;
  try {
    const connection = await pool.getConnection();
    const finalPrice = price || basePrice;
    await connection.query(
      'INSERT INTO ac_services (id, name, description, basePrice, duration) VALUES (?, ?, ?, ?, ?)',
      [id, name, description, finalPrice, duration]
    );
    connection.release();
    res.status(201).json({ id, name, description, basePrice: finalPrice, duration });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/services/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, basePrice, price, duration } = req.body;
  try {
    const connection = await pool.getConnection();
    const finalPrice = price || basePrice;
    await connection.query(
      'UPDATE ac_services SET name = ?, description = ?, basePrice = ?, duration = ? WHERE id = ?',
      [name, description, finalPrice, duration, id]
    );
    const [service] = await connection.query('SELECT * FROM ac_services WHERE id = ?', [id]);
    connection.release();
    res.json(service[0] || { id, name, description, basePrice: finalPrice, duration });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== AC ADDONS API =====
app.get('/api/addons', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [addons] = await connection.query('SELECT * FROM ac_addons');
    connection.release();
    res.json(addons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/addons', async (req, res) => {
  const { id, name, description, price } = req.body;
  try {
    const connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO ac_addons (id, name, description, price) VALUES (?, ?, ?, ?)',
      [id, name, description, price]
    );
    connection.release();
    res.status(201).json({ id, name, description, price });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/addons/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, price } = req.body;
  try {
    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE ac_addons SET name = ?, description = ?, price = ? WHERE id = ?',
      [name, description, price, id]
    );
    const [addon] = await connection.query('SELECT * FROM ac_addons WHERE id = ?', [id]);
    connection.release();
    res.json(addon[0] || { id, name, description, price });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== DELETE ENDPOINTS =====
app.delete('/api/models/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM ac_models WHERE id = ?', [id]);
    connection.release();
    res.json({ message: 'Model deleted successfully', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM ac_categories WHERE id = ?', [id]);
    connection.release();
    res.json({ message: 'Category deleted successfully', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM ac_services WHERE id = ?', [id]);
    connection.release();
    res.json({ message: 'Service deleted successfully', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/addons/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM ac_addons WHERE id = ?', [id]);
    connection.release();
    res.json({ message: 'Addon deleted successfully', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation:`);
  console.log(`   GET  /api/test-connection    - Test database connection`);
  console.log(`   GET  /api/users              - Get all users`);
  console.log(`   POST /api/users              - Create new user`);
  console.log(`   PUT  /api/users/:id          - Update user`);
  console.log(`   GET  /api/orders             - Get all orders`);
  console.log(`   POST /api/orders             - Create new order`);
  console.log(`   PUT  /api/orders/:id         - Update order`);
  console.log(`   GET  /api/models             - Get AC models`);
  console.log(`   POST /api/models             - Create AC model`);
  console.log(`   PUT  /api/models/:id         - Update AC model`);
  console.log(`   GET  /api/categories         - Get AC categories`);
  console.log(`   POST /api/categories         - Create AC category`);
  console.log(`   PUT  /api/categories/:id     - Update AC category`);
  console.log(`   GET  /api/services           - Get AC services`);
  console.log(`   POST /api/services           - Create AC service`);
  console.log(`   PUT  /api/services/:id       - Update AC service`);
  console.log(`   GET  /api/addons             - Get AC addons`);
  console.log(`   POST /api/addons             - Create AC addon`);
  console.log(`   PUT  /api/addons/:id         - Update AC addon`);
});
