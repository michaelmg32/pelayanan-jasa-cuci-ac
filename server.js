import express from 'express';
import next from 'next';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

dotenv.config();

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const googleClient = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

const app = express();
const PORT = process.env.API_PORT || process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production-env';
const JWT_EXPIRY = '24h';

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure upload directories exist inside public/uploads
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve /uploads statically from public/uploads
app.use('/uploads', express.static(uploadDir));

function saveBase64Image(base64Str, prefix = 'img') {
  if (!base64Str || typeof base64Str !== 'string') {
    return base64Str;
  }

  // If it's already a path/URL, don't re-upload
  if (base64Str.startsWith('/') || base64Str.startsWith('http')) {
    return base64Str;
  }

  // Check if it is a base64 data url
  const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return base64Str; // Return as-is if not base64 data url
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  // Determine file extension
  let extension = 'webp';
  if (mimeType === 'image/png') {
    extension = 'png';
  } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    extension = 'jpg';
  } else if (mimeType === 'image/gif') {
    extension = 'gif';
  }

  // Generate unique filename
  const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
  const filePath = path.join(uploadDir, filename);

  // Save the binary image file
  fs.writeFileSync(filePath, buffer);

  // Return the web-accessible relative URL path
  return `/uploads/${filename}`;
}

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

const getOptionalUser = (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (e) {}
  }
  return null;
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
// Initialize database settings table
const initializeDatabaseSettings = async () => {
  let connection;
  try {
    connection = await pool.getConnection();

    // Auto-migration: Create regions table first
    await connection.query(`
      CREATE TABLE IF NOT EXISTS regions (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Auto-migrated 'regions' table");

    // Auto-migration: Add region_id to users
    const [userRegionCols] = await connection.query("SHOW COLUMNS FROM users LIKE 'region_id'");
    if (userRegionCols.length === 0) {
      await connection.query("ALTER TABLE users ADD COLUMN region_id VARCHAR(50) NULL, ADD FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL");
      console.log("✅ Added region_id column to 'users' table");
    }

    // Auto-migration: Add region_id to ac_addons
    const [addonRegionCols] = await connection.query("SHOW COLUMNS FROM ac_addons LIKE 'region_id'");
    if (addonRegionCols.length === 0) {
      await connection.query("ALTER TABLE ac_addons ADD COLUMN region_id VARCHAR(50) NULL, ADD FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL");
      console.log("✅ Added region_id column to 'ac_addons' table");
    }

    // Auto-migration: Add region_id to orders
    const [orderRegionCols] = await connection.query("SHOW COLUMNS FROM orders LIKE 'region_id'");
    if (orderRegionCols.length === 0) {
      await connection.query("ALTER TABLE orders ADD COLUMN region_id VARCHAR(50) NULL, ADD FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL");
      console.log("✅ Added region_id column to 'orders' table");
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key_name VARCHAR(50) PRIMARY KEY,
        value LONGTEXT
      )
    `);

    // Auto-migration: Check if 'id' and 'region_id' columns exist in 'settings' table
    const [idCols] = await connection.query("SHOW COLUMNS FROM settings LIKE 'id'");
    if (idCols.length === 0) {
      // First, drop the primary key constraint on key_name
      try {
        await connection.query("ALTER TABLE settings DROP PRIMARY KEY");
      } catch (e) {
        // Primary key might not exist
      }
      // Then add id as AUTO_INCREMENT PRIMARY KEY, and region_id
      await connection.query("ALTER TABLE settings ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST");
      await connection.query("ALTER TABLE settings ADD COLUMN region_id VARCHAR(50) NULL");
      console.log("✅ Migrated 'settings' table to use id and region_id");
    }

    // Only insert default settings if they don't exist
    const [existingSettings] = await connection.query("SELECT COUNT(*) as count FROM settings WHERE region_id IS NULL AND key_name = 'business_name'");
    if (existingSettings[0].count === 0) {
      await connection.query(`
        INSERT INTO settings (key_name, value, region_id) VALUES 
        ('business_name', 'CoolAir Pro', NULL),
        ('business_logo', '', NULL)
      `);
      console.log('✅ Default settings initialized in database');
    }

    // Auto-migration: Check if 'photo' column exists in 'users' table, if not add it
    const [columns] = await connection.query("SHOW COLUMNS FROM users LIKE 'photo'");
    if (columns.length === 0) {
      await connection.query("ALTER TABLE users ADD COLUMN photo LONGTEXT NULL");
      console.log("✅ Added 'photo' column to 'users' table in database");
    }

    // Auto-migration: Check if 'ktpPhoto' column exists in 'users' table, if not add it
    const [ktpCols] = await connection.query("SHOW COLUMNS FROM users LIKE 'ktpPhoto'");
    if (ktpCols.length === 0) {
      await connection.query("ALTER TABLE users ADD COLUMN ktpPhoto LONGTEXT NULL");
      console.log("✅ Added 'ktpPhoto' column to 'users' table in database");
    }

    // Auto-migration: Check if 'selfiePhoto' column exists in 'users' table, if not add it
    const [selfieCols] = await connection.query("SHOW COLUMNS FROM users LIKE 'selfiePhoto'");
    if (selfieCols.length === 0) {
      await connection.query("ALTER TABLE users ADD COLUMN selfiePhoto LONGTEXT NULL");
      console.log("✅ Added 'selfiePhoto' column to 'users' table in database");
    }

    // Auto-migration: Check if 'status' column exists in 'users' table, if not add it
    const [statusCols] = await connection.query("SHOW COLUMNS FROM users LIKE 'status'");
    if (statusCols.length === 0) {
      await connection.query("ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'active'");
      console.log("✅ Added 'status' column to 'users' table in database");
    }

    // Auto-migration: Ensure 'role' enum includes 'keuangan'
    try {
      await connection.query("ALTER TABLE users MODIFY COLUMN role ENUM('pelanggan', 'karyawan', 'admin', 'owner', 'keuangan') NOT NULL");
      console.log("✅ Auto-migrated 'users.role' ENUM column to support 'keuangan'");
    } catch (err) {
      console.error("⚠️ Failed to modify users.role enum:", err.message);
    }

    // Auto-migration: Check if 'addonsUsed' column exists in 'orders' table, if not add it
    const [orderCols] = await connection.query("SHOW COLUMNS FROM orders LIKE 'addonsUsed'");
    if (orderCols.length === 0) {
      await connection.query("ALTER TABLE orders ADD COLUMN addonsUsed JSON NULL");
      console.log("✅ Added 'addonsUsed' column to 'orders' table in database");
    }

    // Auto-migration: Add reschedule fields to 'orders' table
    const [rescheduleCols] = await connection.query("SHOW COLUMNS FROM orders LIKE 'rescheduleStatus'");
    if (rescheduleCols.length === 0) {
      await connection.query("ALTER TABLE orders ADD COLUMN proposedDate VARCHAR(50) NULL, ADD COLUMN proposedTime VARCHAR(50) NULL, ADD COLUMN rescheduleStatus VARCHAR(50) NULL");
      console.log("✅ Added reschedule fields to 'orders' table in database");
    }

    // Auto-migration: Add cancelReason field to 'orders' table
    const [cancelCols] = await connection.query("SHOW COLUMNS FROM orders LIKE 'cancelReason'");
    if (cancelCols.length === 0) {
      await connection.query("ALTER TABLE orders ADD COLUMN cancelReason VARCHAR(255) NULL");
      console.log("✅ Added cancelReason field to 'orders' table in database");
    }

    // Auto-migration: Add workerCancelReason field to 'orders' table
    const [workerCancelCols] = await connection.query("SHOW COLUMNS FROM orders LIKE 'workerCancelReason'");
    if (workerCancelCols.length === 0) {
      await connection.query("ALTER TABLE orders ADD COLUMN workerCancelReason VARCHAR(255) NULL");
      console.log("✅ Added workerCancelReason field to 'orders' table in database");
    }

    // Auto-migration: Add invoiceSent field to 'orders' table
    const [invoiceSentCols] = await connection.query("SHOW COLUMNS FROM orders LIKE 'invoiceSent'");
    if (invoiceSentCols.length === 0) {
      await connection.query("ALTER TABLE orders ADD COLUMN invoiceSent BOOLEAN DEFAULT FALSE");
      console.log("✅ Added invoiceSent field to 'orders' table in database");
    }

    // Auto-migration: Add paymentProof field to 'orders' table
    const [paymentProofCols] = await connection.query("SHOW COLUMNS FROM orders LIKE 'paymentProof'");
    if (paymentProofCols.length === 0) {
      await connection.query("ALTER TABLE orders ADD COLUMN paymentProof LONGTEXT NULL");
      console.log("✅ Added paymentProof field to 'orders' table in database");
    }

    // Auto-migration: Add hpp column to 'ac_addons' table
    const [addonHppCols] = await connection.query("SHOW COLUMNS FROM ac_addons LIKE 'hpp'");
    if (addonHppCols.length === 0) {
      await connection.query("ALTER TABLE ac_addons ADD COLUMN hpp DECIMAL(10, 2) DEFAULT 0");
      console.log("✅ Added hpp column to 'ac_addons' table in database");
    }

    // Auto-migration: Add margin column to 'orders' table
    const [marginCols] = await connection.query("SHOW COLUMNS FROM orders LIKE 'margin'");
    if (marginCols.length === 0) {
      await connection.query("ALTER TABLE orders ADD COLUMN margin DECIMAL(10, 2) DEFAULT 0");
      console.log("✅ Added margin column to 'orders' table in database");
    }

    // Auto-migration: Add quantity column to 'orders' table
    const [qtyCols] = await connection.query("SHOW COLUMNS FROM orders LIKE 'quantity'");
    if (qtyCols.length === 0) {
      await connection.query("ALTER TABLE orders ADD COLUMN quantity INT DEFAULT 1");
      console.log("✅ Added quantity column to 'orders' table in database");
    }

    // Auto-migration: Add hpp_orders column to 'orders' table
    const [hppOrdersCols] = await connection.query("SHOW COLUMNS FROM orders LIKE 'hpp_orders'");
    if (hppOrdersCols.length === 0) {
      await connection.query("ALTER TABLE orders ADD COLUMN hpp_orders DECIMAL(10, 2) DEFAULT 0");
      console.log("✅ Added hpp_orders column to 'orders' table in database");
    }

    // Auto-migration: Add finalPrice column to 'orders' table
    const [finalPriceCols] = await connection.query("SHOW COLUMNS FROM orders LIKE 'finalPrice'");
    if (finalPriceCols.length === 0) {
      await connection.query("ALTER TABLE orders ADD COLUMN finalPrice DECIMAL(10, 2) DEFAULT 0");
      console.log("✅ Added finalPrice column to 'orders' table in database");
    }

    // Auto-migration: Add voucher columns to orders table (Moved up to prevent backfill query failure)
    const [ordersCols] = await connection.query("SHOW COLUMNS FROM orders LIKE 'voucher_code'");
    if (ordersCols.length === 0) {
      await connection.query("ALTER TABLE orders ADD COLUMN voucher_code VARCHAR(50) NULL");
      await connection.query("ALTER TABLE orders ADD COLUMN voucher_discount DECIMAL(10, 2) DEFAULT 0");
      console.log("✅ Added voucher columns to 'orders' table in database");
    }

    // Backfill calculations for existing orders (quantity, hpp_orders, finalPrice, margin)
    const [existingOrders] = await connection.query("SELECT id, acDetail, serviceCost, addonsUsed, voucher_discount FROM orders");
    if (existingOrders.length > 0) {
      console.log(`⏳ Migrating/Backfilling ${existingOrders.length} orders for the new margin system...`);
      for (const order of existingOrders) {
        let quantity = 1;
        if (order.acDetail) {
          try {
            const acDetailParsed = typeof order.acDetail === 'string' ? JSON.parse(order.acDetail) : order.acDetail;
            if (Array.isArray(acDetailParsed)) {
              quantity = acDetailParsed.reduce((sum, item) => sum + (item.quantity || 1), 0);
            } else if (acDetailParsed && typeof acDetailParsed.quantity === 'number') {
              quantity = acDetailParsed.quantity;
            }
          } catch (e) { }
        }

        let totalAddonsSales = 0;
        let totalAddonsHpp = 0;
        if (order.addonsUsed) {
          try {
            const addonsUsedParsed = typeof order.addonsUsed === 'string' ? JSON.parse(order.addonsUsed) : order.addonsUsed;
            if (Array.isArray(addonsUsedParsed)) {
              addonsUsedParsed.forEach(ad => {
                const price = Number(ad.price) || 0;
                const hpp = Number(ad.hpp) || 0;
                const qty = Number(ad.quantity) || 0;
                totalAddonsSales += price * qty;
                totalAddonsHpp += hpp * qty;
              });
            }
          } catch (e) { }
        }

        const serviceCostTotal = Number(order.serviceCost) || 0;
        const totalCost = serviceCostTotal;
        const discount = Number(order.voucher_discount) || 0;
        const finalPrice = Math.max(0, totalCost + totalAddonsSales - discount);
        const hpp_orders = totalAddonsHpp;
        const margin = finalPrice - hpp_orders;

        await connection.query(
          "UPDATE orders SET quantity = ?, totalCost = ?, finalPrice = ?, hpp_orders = ?, margin = ?, addonsCost = ? WHERE id = ?",
          [quantity, totalCost, finalPrice, hpp_orders, margin, totalAddonsSales, order.id]
        );
      }
      console.log(`✅ Backfilled financial columns for ${existingOrders.length} orders successfully.`);
    }

    // Auto-migration: Create ac_addon_transactions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ac_addon_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        addonId VARCHAR(50) NOT NULL,
        type ENUM('masuk', 'keluar') NOT NULL,
        qty INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        notes TEXT,
        orderId VARCHAR(50) NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (addonId) REFERENCES ac_addons(id) ON DELETE CASCADE,
        FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE SET NULL
      )
    `);
    console.log("✅ Auto-migrated 'ac_addon_transactions' table in database");

    // Auto-migration: Create ac_service_prices table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ac_service_prices (
        id VARCHAR(50) PRIMARY KEY,
        serviceId VARCHAR(50) NOT NULL,
        modelId VARCHAR(50) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (serviceId) REFERENCES ac_services(id) ON DELETE CASCADE,
        FOREIGN KEY (modelId) REFERENCES ac_models(id) ON DELETE CASCADE,
        UNIQUE INDEX idx_service_model (serviceId, modelId)
      )
    `);
    console.log("✅ Auto-migrated 'ac_service_prices' table in database");

    // Auto-migration: Remove basePrice and price from ac_services if they exist
    try {
      const [svcCols1] = await connection.query("SHOW COLUMNS FROM ac_services LIKE 'basePrice'");
      if (svcCols1.length > 0) {
        await connection.query("ALTER TABLE ac_services DROP COLUMN basePrice");
        console.log("✅ Dropped 'basePrice' column from 'ac_services'");
      }
      const [svcCols2] = await connection.query("SHOW COLUMNS FROM ac_services LIKE 'price'");
      if (svcCols2.length > 0) {
        await connection.query("ALTER TABLE ac_services DROP COLUMN price");
        console.log("✅ Dropped 'price' column from 'ac_services'");
      }
    } catch (e) {
      console.log("⚠️ Could not drop columns from ac_services (might be due to constraints):", e.message);
    }

    // Check if we need to seed initial transactions
    const [txCountRows] = await connection.query("SELECT COUNT(*) as count FROM ac_addon_transactions");
    const txCount = txCountRows[0]?.count || 0;
    if (txCount === 0) {
      console.log("⏳ Seeding initial addon transactions...");

      // 1. Seed starting stock of 100 for each existing addon
      const [allAddons] = await connection.query("SELECT id, hpp, name FROM ac_addons");
      for (const addon of allAddons) {
        const hppValue = Number(addon.hpp) || 0;
        await connection.query(
          "INSERT INTO ac_addon_transactions (addonId, type, qty, price, notes) VALUES (?, 'masuk', 100, ?, ?)",
          [addon.id, hppValue, `Stok awal migrasi sistem (${addon.name})`]
        );
      }
      console.log(`✅ Seeded starting stock of 100 units for ${allAddons.length} addons.`);

      // 2. Seed 'keluar' transactions for completed ('SELESAI') orders
      const [completedOrders] = await connection.query(
        "SELECT id, addonsUsed, completedAt FROM orders WHERE status = 'SELESAI'"
      );
      let backfilledOrdersCount = 0;
      for (const order of completedOrders) {
        if (order.addonsUsed) {
          try {
            const addonsUsedParsed = typeof order.addonsUsed === 'string' ? JSON.parse(order.addonsUsed) : order.addonsUsed;
            if (Array.isArray(addonsUsedParsed)) {
              for (const addonUsed of addonsUsedParsed) {
                const qty = Number(addonUsed.quantity) || 0;
                const costPrice = Number(addonUsed.hpp) || Number(addonUsed.price) || 0;
                const addonId = addonUsed.id;
                if (addonId && qty > 0) {
                  const [addonCheck] = await connection.query("SELECT id FROM ac_addons WHERE id = ?", [addonId]);
                  if (addonCheck.length > 0) {
                    await connection.query(
                      "INSERT INTO ac_addon_transactions (addonId, type, qty, price, notes, orderId, createdAt) VALUES (?, 'keluar', ?, ?, ?, ?, ?)",
                      [addonId, qty, costPrice, `Pemakaian pesanan completed ${order.id}`, order.id, order.completedAt || new Date()]
                    );
                  }
                }
              }
              backfilledOrdersCount++;
            }
          } catch (e) {
            console.error(`Error backfilling addons for order ${order.id}:`, e);
          }
        }
      }
      console.log(`✅ Backfilled transaction logs for ${backfilledOrdersCount} completed orders.`);
    }



    // Auto-migration: Create vouchers table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vouchers (
        id VARCHAR(50) PRIMARY KEY,
        code VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        discount_type ENUM('percentage', 'fixed') NOT NULL,
        discount_value DECIMAL(10, 2) NOT NULL,
        min_order_amount DECIMAL(10, 2) DEFAULT 0,
        max_discount_amount DECIMAL(10, 2) NULL,
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        max_uses_total INT NULL,
        new_user_only BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        region_id VARCHAR(50) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE,
        UNIQUE INDEX idx_code_region (code, region_id)
      )
    `);
    console.log("✅ Auto-migrated 'vouchers' table in database");

    // Auto-migration: Create voucher_usages table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS voucher_usages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        voucher_id VARCHAR(50) NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        order_id VARCHAR(50) NOT NULL,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        UNIQUE INDEX idx_user_voucher_order (user_id, voucher_id, order_id)
      )
    `);
    console.log("✅ Auto-migrated 'voucher_usages' table in database");
    // =====================================================================
    // PAYROLL SYSTEM MIGRATIONS
    // =====================================================================

    // Auto-migration: Create staff_grades table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS staff_grades (
        id VARCHAR(50) PRIMARY KEY,
        region_id VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE,
        UNIQUE INDEX idx_grade_name_region (name, region_id)
      )
    `);
    console.log("✅ Auto-migrated 'staff_grades' table");


    // Auto-migration: Add grade_id column to users table
    const [gradeColCheck] = await connection.query("SHOW COLUMNS FROM users LIKE 'grade_id'");
    if (gradeColCheck.length === 0) {
      await connection.query("ALTER TABLE users ADD COLUMN grade_id VARCHAR(50) NULL");
      console.log("✅ Added 'grade_id' column to 'users' table");
    }

          // Auto-migration: Add monthly salary columns to staff_grades
      const monthlyCols = ['leader_monthly_base_salary', 'leader_monthly_travel_allowance', 'member_monthly_base_salary', 'member_monthly_travel_allowance'];
      for (const col of monthlyCols) {
        const [colCheck] = await connection.query(`SHOW COLUMNS FROM staff_grades LIKE '${col}'`);
        if (colCheck.length === 0) {
          await connection.query(`ALTER TABLE staff_grades ADD COLUMN ${col} DECIMAL(10,2) DEFAULT 0`);
          console.log(`✅ Added '${col}' column to 'staff_grades' table`);
        }
      }

      // Auto-migration: Add salary_type, monthly_salary_date, last_monthly_salary_paid to users
      const userMonthlyCols = [
        { name: 'salary_type', def: "VARCHAR(20) DEFAULT 'daily'" },
        { name: 'monthly_salary_date', def: "INT NULL" },
        { name: 'last_monthly_salary_paid', def: "DATE NULL" }
      ];
      for (const col of userMonthlyCols) {
        const [colCheck] = await connection.query(`SHOW COLUMNS FROM users LIKE '${col.name}'`);
        if (colCheck.length === 0) {
          await connection.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.def}`);
          console.log(`✅ Added '${col.name}' column to 'users' table`);
        }
      }

      // Auto-migration: Create monthly_salary_history table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS monthly_salary_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(50) NOT NULL,
          amount DECIMAL(10,2) DEFAULT 0,
          notes VARCHAR(255) NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log("✅ Auto-migrated 'monthly_salary_history' table");

      // Auto-migration: Create fixed_assets table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS fixed_assets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        region_id VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        purchase_date DATE NOT NULL,
        purchase_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
        description TEXT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Auto-migrated 'fixed_assets' table");



  } catch (err) {
    console.error('❌ Failed to initialize settings table in database:', err);
  } finally {
    if (connection) connection.release();
  }
};
initializeDatabaseSettings();

// GET App Settings
app.get('/api/settings', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM settings');
    const settings = {};
    rows.forEach(row => {
      const regionKey = row.region_id || 'GLOBAL';
      if (!settings[regionKey]) settings[regionKey] = {};
      settings[regionKey][row.key_name] = row.value;
    });
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// PUT App Settings (Update Settings)
app.put('/api/settings', verifyToken, async (req, res) => {
  const { business_name, business_logo, bank_name, bank_account_number, bank_account_holder, qris_image, phone_number } = req.body;
  const region_id = req.user.region_id || null;
  let connection;
  try {
    connection = await pool.getConnection();
    
    const updates = [];
    if (!region_id) {
      // Pusat only
      if (business_name !== undefined) updates.push({ key: 'business_name', val: business_name });
      if (business_logo !== undefined) {
        const logoSaved = saveBase64Image(business_logo, 'business_logo');
        updates.push({ key: 'business_logo', val: logoSaved });
      }
    } else {
      // Cabang only
      if (bank_name !== undefined) updates.push({ key: 'bank_name', val: bank_name });
      if (bank_account_number !== undefined) updates.push({ key: 'bank_account_number', val: bank_account_number });
      if (bank_account_holder !== undefined) updates.push({ key: 'bank_account_holder', val: bank_account_holder });
      if (qris_image !== undefined) {
        const qrisSaved = saveBase64Image(qris_image, 'qris_image');
        updates.push({ key: 'qris_image', val: qrisSaved });
      }
      if (phone_number !== undefined) updates.push({ key: 'phone_number', val: phone_number });
    }

    for (const u of updates) {
      if (!region_id) {
        const [existing] = await connection.query('SELECT id FROM settings WHERE key_name = ? AND region_id IS NULL', [u.key]);
        if (existing.length > 0) {
          await connection.query('UPDATE settings SET value = ? WHERE key_name = ? AND region_id IS NULL', [u.val, u.key]);
        } else {
          await connection.query('INSERT INTO settings (key_name, value, region_id) VALUES (?, ?, NULL)', [u.key, u.val]);
        }
      } else {
        const [existing] = await connection.query('SELECT id FROM settings WHERE key_name = ? AND region_id = ?', [u.key, region_id]);
        if (existing.length > 0) {
          await connection.query('UPDATE settings SET value = ? WHERE key_name = ? AND region_id = ?', [u.val, u.key, region_id]);
        } else {
          await connection.query('INSERT INTO settings (key_name, value, region_id) VALUES (?, ?, ?)', [u.key, u.val, region_id]);
        }
      }
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// ===== ACTIVITY LOGS HELPER & API =====
const logActivity = async (req, action, details) => {
  // Activity logging disabled
};

app.get('/api/activity-logs', verifyToken, async (req, res) => {
  res.json([]);
});

// ===== AUTHENTICATION API =====
// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email/Nomor Telepon dan password diperlukan' });
    }

    const connection = await pool.getConnection();
    const [users] = await connection.query('SELECT * FROM users WHERE email = ? OR phone = ?', [email, email]);
    connection.release();

    if (users.length === 0) {
      return res.status(401).json({ error: 'Pengguna tidak ditemukan' });
    }

    const user = users[0];

    // Verify password
    const passwordMatch = await bcryptjs.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Check status
    if (user.status !== 'active') {
      if (user.status === 'archived') {
        return res.status(403).json({ error: 'Akun Anda telah dinonaktifkan (diarsipkan). Silakan hubungi admin.' });
      }
      return res.status(403).json({ error: 'Akun Anda belum aktif. Silakan tunggu verifikasi admin.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, region_id: user.region_id },
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
  const { credential, role } = req.body;
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
      if (role === 'karyawan') {
        connection.release();
        return res.json({ isNewEmployee: true, email, name });
      }

      // User doesn't exist, create them as customer (pelanggan)
      const newId = `usr_google_${Date.now()}`;

      // Generate dummy password for Google users
      const salt = await bcryptjs.genSalt(10);
      const dummyPassword = await bcryptjs.hash(Math.random().toString(36), salt);

      await connection.query(
        "INSERT INTO users (id, name, email, role, password, status) VALUES (?, ?, ?, ?, ?, 'active')",
        [newId, name, email, 'pelanggan', dummyPassword]
      );

      user = { id: newId, name, email, role: 'pelanggan', status: 'active' };
    } else {
      user = users[0];
      if (user.status !== 'active') {
        connection.release();
        if (user.status === 'archived') {
          return res.status(403).json({ error: 'Akun Anda telah dinonaktifkan (diarsipkan). Silakan hubungi admin.' });
        }
        return res.status(403).json({ error: 'Akun Anda belum aktif. Silakan tunggu verifikasi admin.' });
      }
    }

    connection.release();

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, region_id: user.region_id },
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

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  const { id, name, email, phone, address, password, role, ktpPhoto, selfiePhoto } = req.body;
  try {
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name required' });
    }

    const registrationRole = role || 'pelanggan';
    const isEmployee = registrationRole === 'karyawan';

    // Additional validations for employees
    if (isEmployee) {
      if (!phone) {
        return res.status(400).json({ error: 'Nomor WhatsApp wajib diisi.' });
      }
      if (!address) {
        return res.status(400).json({ error: 'Alamat wajib diisi.' });
      }
      if (!ktpPhoto) {
        return res.status(400).json({ error: 'Foto KTP wajib diunggah.' });
      }
      if (!selfiePhoto) {
        return res.status(400).json({ error: 'Foto Selfie wajib diunggah.' });
      }
    }

    const status = isEmployee ? 'inactive' : 'active';

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const connection = await pool.getConnection();

    // Check if email already exists
    const [existingUsers] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'Email sudah terdaftar.' });
    }

    // Check if phone already exists
    if (phone) {
      const [existingPhones] = await connection.query('SELECT id FROM users WHERE phone = ?', [phone]);
      if (existingPhones.length > 0) {
        connection.release();
        return res.status(400).json({ error: 'Nomor telepon sudah terdaftar.' });
      }
    }

    // Insert new user
    const newId = id || `usr_${Date.now()}`;
    const ktpPhotoUrl = saveBase64Image(ktpPhoto, `user_${newId}_ktp`);
    const selfiePhotoUrl = saveBase64Image(selfiePhoto, `user_${newId}_selfie`);

    await connection.query(
      'INSERT INTO users (id, name, email, phone, address, role, password, ktpPhoto, selfiePhoto, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        newId,
        name,
        email,
        phone || null,
        address || null,
        registrationRole,
        hashedPassword,
        ktpPhotoUrl || null,
        selfiePhotoUrl || null,
        status
      ]
    );

    connection.release();

    if (status === 'inactive') {
      return res.status(201).json({
        message: 'Registrasi berhasil! Akun Karyawan Anda sedang menunggu verifikasi admin.',
        status: 'inactive'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: newId, email, role: registrationRole },
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
        address: address || null,
        role: registrationRole,
        status
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

// ===== REGIONS API =====
app.get('/api/regions', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [regions] = await connection.query('SELECT * FROM regions ORDER BY name ASC');
    connection.release();
    res.json(regions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post('/api/regions', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner') return res.status(403).json({ error: 'Unauthorized' });
  try {
    const { name } = req.body;
    const id = 'reg_' + Date.now();
    const connection = await pool.getConnection();
    await connection.query('INSERT INTO regions (id, name) VALUES (?, ?)', [id, name]);
    connection.release();
    res.json({ id, name });
  } catch (error) { res.status(500).json({ error: error.message }); }
});
app.delete('/api/regions/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner') return res.status(403).json({ error: 'Unauthorized' });
  try {
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM regions WHERE id = ?', [req.params.id]);
    connection.release();
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ===== USERS API =====
app.get('/api/users', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
        let query = 'SELECT id, name, email, phone, role, photo, address, lat, lng, ktpPhoto, selfiePhoto, status, createdAt, region_id, is_leader FROM users';
    let params = [];
    const userRole = req.user.role ? req.user.role.toUpperCase() : '';
    if (userRole === 'ADMIN' || userRole === 'KARYAWAN') {
       if (req.user.region_id) {
         query += ' WHERE region_id = ? OR (region_id IS NULL AND LOWER(role) IN ("user", "pelanggan"))';
         params.push(req.user.region_id);
       }
    } else if (req.query.region_id) {
       query += ' WHERE region_id = ?';
       params.push(req.query.region_id);
    }
    const [users] = await connection.query(query, params);
    connection.release();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  let { id, name, email, phone, role, password, region_id, ktpPhoto, selfiePhoto } = req.body;
  try {
    if (!email && phone) {
      email = `${phone}@sugarac.com`;
    }

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email (or phone), password, and name required' });
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const connection = await pool.getConnection();
    
    // Check if phone already exists
    if (phone) {
      const [existingPhone] = await connection.query('SELECT id FROM users WHERE phone = ?', [phone]);
      if (existingPhone.length > 0) {
        connection.release();
        return res.status(400).json({ error: 'Nomor telepon sudah terdaftar.' });
      }
    }

    const userId = id || `usr_${Date.now()}`;
    await connection.query(
      'INSERT INTO users (id, name, email, phone, role, password, region_id, ktpPhoto, selfiePhoto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, name, email, phone || null, role || 'pelanggan', hashedPassword, region_id || null, ktpPhoto || null, selfiePhoto || null]
    );
    connection.release();
    await logActivity(req, 'Menambahkan Pengguna', `Menambahkan pengguna baru: ${name} (${role})`);
    res.status(201).json({ id: userId, name, email, phone, role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, role, password, address, photo, status, region_id } = req.body;
  try {
    const connection = await pool.getConnection();

    // Check if phone already exists on another user
    if (phone) {
      const [existingPhone] = await connection.query('SELECT id FROM users WHERE phone = ? AND id != ?', [phone, id]);
      if (existingPhone.length > 0) {
        connection.release();
        return res.status(400).json({ error: 'Nomor telepon sudah terdaftar pada akun lain.' });
      }
    }

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
      const [currentUserRows] = await connection.query('SELECT role FROM users WHERE id = ?', [id]);
      if (currentUserRows.length > 0 && currentUserRows[0].role !== role) {
        if (req.user.role !== 'owner') {
          connection.release();
          return res.status(403).json({ error: 'Hanya Owner yang diperbolehkan mengelola/mengubah peran (role) pengguna.' });
        }
      }
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
    if (photo !== undefined) {
      const photoSaved = saveBase64Image(photo, `user_${id}_photo`);
      updateFields.push('photo = ?');
      updateValues.push(photoSaved);
    }
    if (req.body.ktpPhoto !== undefined) {
      const ktpSaved = saveBase64Image(req.body.ktpPhoto, `user_${id}_ktp`);
      updateFields.push('ktpPhoto = ?');
      updateValues.push(ktpSaved);
    }
    if (req.body.selfiePhoto !== undefined) {
      const selfieSaved = saveBase64Image(req.body.selfiePhoto, `user_${id}_selfie`);
      updateFields.push('selfiePhoto = ?');
      updateValues.push(selfieSaved);
    }
    if (region_id !== undefined) {
      updateFields.push('region_id = ?');
      updateValues.push(region_id === '' ? null : region_id);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (updateFields.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);
    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

    await connection.query(updateQuery, updateValues);

    await logActivity(req, 'Memperbarui Pengguna', `Memperbarui data pengguna ID: ${id}`);

    const [user] = await connection.query('SELECT id, name, email, phone, role, address, lat, lng, photo, ktpPhoto, selfiePhoto, status FROM users WHERE id = ?', [id]);
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

// Endpoint untuk aktivasi user (karyawan) oleh admin
app.put('/api/users/:id/activate', verifyToken, async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Hanya Admin atau Owner yang dapat mengaktifkan pengguna.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // Check if user exists
    const [users] = await connection.query('SELECT name, role FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }

    const user = users[0];

    // Update status to active
    await connection.query("UPDATE users SET status = 'active' WHERE id = ?", [id]);

    connection.release();

    await logActivity(req, 'Mengaktifkan Karyawan', `Mengaktifkan akun karyawan: ${user.name} (${id})`);

    res.json({ message: 'Akun berhasil diaktifkan.', id, name: user.name, status: 'active' });
  } catch (error) {
    if (connection) connection.release();
    console.error('Error activating user:', error);
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
app.get('/api/orders', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
        let query = 'SELECT * FROM orders';
    let params = [];
    const userRole = req.user.role ? req.user.role.toUpperCase() : '';
    if (userRole === 'ADMIN' || userRole === 'KARYAWAN' || (userRole === 'OWNER' && req.user.region_id)) {
       if (req.user.region_id) {
         query += ' WHERE region_id = ?';
         params.push(req.user.region_id);
       }
    } else if (req.query.region_id) {
       query += ' WHERE region_id = ?';
       params.push(req.query.region_id);
    }
    const [orders] = await connection.query(query, params);
    connection.release();

    // Parse JSON fields and map workerId to assignedTo
    const parsedOrders = orders.map(order => ({
      ...order,
      assignedTo: order.workerId, // Map database field to API field
      acDetail: order.acDetail ? (Array.isArray(JSON.parse(order.acDetail)) ? JSON.parse(order.acDetail) : [JSON.parse(order.acDetail)]) : [],
      serviceIds: order.serviceIds ? JSON.parse(order.serviceIds) : [],
      addonIds: order.addonIds ? JSON.parse(order.addonIds) : [],
      addonsUsed: order.addonsUsed ? JSON.parse(order.addonsUsed) : []
    }));

    // Auto-cancel past MENUNGGU orders
    const now = new Date();
    const updatedOrders = [];
    for (let order of parsedOrders) {
      if (order.status === 'MENUNGGU' && order.scheduledDate && order.scheduledTime) {
        const orderTime = new Date(`${order.scheduledDate}T${order.scheduledTime}`);
        if (orderTime < now) {
          // It's in the past and still waiting, auto cancel it
          order.status = 'DIBATALKAN';
          order.cancelReason = 'Dibatalkan Otomatis oleh Sistem (Melewati Batas Waktu)';

          try {
            const updateConn = await pool.getConnection();
            await updateConn.query(
              'UPDATE orders SET status = ?, cancelReason = ? WHERE id = ?',
              [order.status, order.cancelReason, order.id]
            );
            updateConn.release();
          } catch (e) {
            console.error('Error auto-canceling order:', e);
          }
        }
      }
      updatedOrders.push(order);
    }

    res.json(updatedOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const getAddonStockAndHpp = async (connection, addonId) => {
  const [addonRows] = await connection.query("SELECT hpp FROM ac_addons WHERE id = ?", [addonId]);
  if (addonRows.length === 0) return { stock: 0, hpp: 0 };
  const hpp = Number(addonRows[0].hpp) || 0;

  const [txRows] = await connection.query(`
    SELECT CAST(COALESCE(SUM(CASE WHEN type = 'masuk' THEN qty ELSE -qty END), 0) AS SIGNED) AS stock
    FROM ac_addon_transactions
    WHERE addonId = ?
  `, [addonId]);

  return {
    stock: txRows[0]?.stock || 0,
    hpp
  };
};

const syncOrderAddonTransactions = async (connection, orderId) => {
  const [orders] = await connection.query(
    "SELECT status, addonsUsed FROM orders WHERE id = ?",
    [orderId]
  );
  if (orders.length === 0) return;
  const order = orders[0];
  const status = order.status;

  let addonsUsed = [];
  if (order.addonsUsed) {
    try {
      addonsUsed = typeof order.addonsUsed === 'string' ? JSON.parse(order.addonsUsed) : order.addonsUsed;
    } catch (e) {
      console.error(`Error parsing addonsUsed for order ${orderId} in sync:`, e);
    }
  }

  if (status !== 'SELESAI') {
    await connection.query(
      "DELETE FROM ac_addon_transactions WHERE orderId = ? AND type = 'keluar'",
      [orderId]
    );
    return;
  }

  let updatedAddonsUsed = [];
  let updated = false;

  if (Array.isArray(addonsUsed)) {
    for (const item of addonsUsed) {
      let currentItem = { ...item };
      if (currentItem.hpp === undefined || currentItem.hpp === null) {
        const [addonRows] = await connection.query("SELECT hpp FROM ac_addons WHERE id = ?", [currentItem.id]);
        if (addonRows.length > 0) {
          currentItem.hpp = Number(addonRows[0].hpp) || 0;
          updated = true;
        } else {
          currentItem.hpp = 0;
        }
      }
      updatedAddonsUsed.push(currentItem);
    }
  }

  if (updated) {
    await connection.query(
      "UPDATE orders SET addonsUsed = ? WHERE id = ?",
      [JSON.stringify(updatedAddonsUsed), orderId]
    );
    addonsUsed = updatedAddonsUsed;
  }

  await connection.query(
    "DELETE FROM ac_addon_transactions WHERE orderId = ? AND type = 'keluar'",
    [orderId]
  );

  if (Array.isArray(addonsUsed)) {
    for (const item of addonsUsed) {
      const qty = Number(item.quantity) || 0;
      const hppVal = Number(item.hpp) || 0;
      if (item.id && qty > 0) {
        await connection.query(
          "INSERT INTO ac_addon_transactions (addonId, type, qty, price, notes, orderId) VALUES (?, 'keluar', ?, ?, ?, ?)",
          [item.id, qty, hppVal, `Pemakaian pesanan completed ${orderId}`, orderId]
        );
      }
    }
  }
};

const recalculateOrderMargin = async (connection, orderId) => {
  try {
    const [rows] = await connection.query('SELECT acDetail, serviceCost, addonsUsed, voucher_discount FROM orders WHERE id = ?', [orderId]);
    if (rows.length > 0) {
      const order = rows[0];

      let quantity = 1;
      if (order.acDetail) {
        try {
          const acDetailParsed = typeof order.acDetail === 'string' ? JSON.parse(order.acDetail) : order.acDetail;
          if (Array.isArray(acDetailParsed)) {
            quantity = acDetailParsed.reduce((sum, item) => sum + (item.quantity || 1), 0);
          } else if (acDetailParsed && typeof acDetailParsed.quantity === 'number') {
            quantity = acDetailParsed.quantity;
          }
        } catch (e) {
          console.error('Error parsing acDetail for quantity recalculation:', e);
        }
      }

      let totalAddonsSales = 0;
      let totalAddonsHpp = 0;
      if (order.addonsUsed) {
        try {
          const addonsUsedParsed = typeof order.addonsUsed === 'string' ? JSON.parse(order.addonsUsed) : order.addonsUsed;
          if (Array.isArray(addonsUsedParsed)) {
            addonsUsedParsed.forEach(ad => {
              const price = Number(ad.price) || 0;
              const hpp = Number(ad.hpp) || 0;
              const qty = Number(ad.quantity) || 0;
              totalAddonsSales += price * qty;
              totalAddonsHpp += hpp * qty;
            });
          }
        } catch (e) {
          console.error('Error parsing addonsUsed for margin recalculation:', e);
        }
      }

      const discount = Number(order.voucher_discount) || 0;
      const totalCost = Number(order.serviceCost) || 0;
      const finalPrice = Math.max(0, totalCost + totalAddonsSales - discount);
      const hpp_orders = totalAddonsHpp;
      const margin = finalPrice - hpp_orders;

      await connection.query(
        'UPDATE orders SET quantity = ?, totalCost = ?, finalPrice = ?, hpp_orders = ?, margin = ?, addonsCost = ? WHERE id = ?',
        [quantity, totalCost, finalPrice, hpp_orders, margin, totalAddonsSales, orderId]
      );
      console.log(`📊 Margin Recalculated for ${orderId}: qty=${quantity}, totalCost=${totalCost}, finalPrice=${finalPrice}, hpp_orders=${hpp_orders}, margin=${margin}`);
    }
  } catch (err) {
    console.error(`❌ Failed to recalculate margin for order ${orderId}:`, err);
  }
};

const sendFonnteInvoice = async (orderId, force = false) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [orders] = await connection.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) return;
    const order = orders[0];

    // If invoice is already sent or status is not SELESAI, don't send (unless forced)
    if (!force && (order.status !== 'SELESAI' || order.invoiceSent === 1)) {
      console.log(`ℹ️ Skip sending Fonnte invoice for ${orderId}: status=${order.status}, invoiceSent=${order.invoiceSent}`);
      return;
    }

    const [settings] = await connection.query("SELECT value FROM settings WHERE key_name = 'business_name' AND (region_id = ? OR region_id IS NULL) ORDER BY region_id DESC LIMIT 1", [order.region_id || null]);
    const businessName = settings.length > 0 ? settings[0].value : 'CoolAir Pro';

    let phone = order.customerPhone || '';
    phone = phone.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }
    if (!phone) {
      console.warn(`⚠️ Cannot send Fonnte invoice: customer phone is missing for order ${orderId}`);
      return;
    }

    let acDetail = null;
    try {
      acDetail = order.acDetail ? JSON.parse(order.acDetail) : null;
    } catch (e) {
      console.error('Error parsing acDetail for Fonnte:', e);
    }

    const serviceName = acDetail
      ? `${acDetail.quantity || 0}x ${acDetail.serviceType === 'none' ? acDetail.category : acDetail.serviceType} (${acDetail.acType || ''})`
      : 'Jasa Layanan AC';

    let addonsUsedParsed = [];
    if (order.addonsUsed) {
      try {
        addonsUsedParsed = typeof order.addonsUsed === 'string' ? JSON.parse(order.addonsUsed) : order.addonsUsed;
      } catch (e) {
        console.error('Error parsing addonsUsed for Fonnte:', e);
      }
    }

    let totalAddonsSales = 0;
    let addonsText = '';
    if (addonsUsedParsed && addonsUsedParsed.length > 0) {
      addonsText = '\n*Perlengkapan Tambahan:*\n';
      addonsUsedParsed.forEach(ad => {
        const unitPrice = Number(ad.price || 0);
        const qty = Number(ad.quantity || 0);
        const subTotal = unitPrice * qty;
        totalAddonsSales += subTotal;
        addonsText += `- ${ad.name} (${qty}x @ Rp${unitPrice.toLocaleString('id-ID')}): Rp${subTotal.toLocaleString('id-ID')}\n`;
      });
      addonsText += `*Total Perlengkapan:* Rp${totalAddonsSales.toLocaleString('id-ID')}\n`;
    }

    const grandTotal = order.finalPrice || (Number(order.serviceCost || 0) + totalAddonsSales);

    const message = `Halo Kak *${order.customerName}*,\n\nBerikut adalah rincian tagihan/invoice untuk pengerjaan AC Anda oleh *${businessName}*:\n\n*Order ID:* ${order.id}\n*Tanggal Pengerjaan:* ${order.scheduledDate} (${order.scheduledTime})\n*Layanan:* ${serviceName}\n\n*Rincian Biaya:*\n- Jasa Utama: Rp${Number(order.serviceCost || 0).toLocaleString('id-ID')}${addonsText}\n*Grand Total:* *Rp${Number(grandTotal).toLocaleString('id-ID')}*\n\n*Status:* ✅ *LUNAS*\n\nTerima kasih telah mempercayakan ${businessName} untuk kenyamanan AC Anda! 🙏❄️`;

    const fonnteApiKey = process.env.FONNTE_API_KEY || 'obJEoZWPQy74AcesKRtx';

    console.log(`Sending auto invoice via Fonnte to ${phone} for order ${orderId}...`);

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': fonnteApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target: phone,
        message: message
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Fonnte send invoice success:', result);
      await connection.query('UPDATE orders SET invoiceSent = 1 WHERE id = ?', [orderId]);
    } else {
      const errText = await response.text();
      console.error('❌ Fonnte send invoice failed:', errText);
    }
  } catch (err) {
    console.error('❌ Error sending Fonnte invoice:', err);
  } finally {
    if (connection) connection.release();
  }
};

const sendFonnteNotification = async (orderId, type) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [orders] = await connection.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) return;
    const order = orders[0];

    const [settings] = await connection.query("SELECT value FROM settings WHERE key_name = 'business_name' AND (region_id = ? OR region_id IS NULL) ORDER BY region_id DESC LIMIT 1", [order.region_id || null]);
    const businessName = settings.length > 0 ? settings[0].value : 'CoolAir Pro';

    let phone = order.customerPhone || '';
    phone = phone.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }
    if (!phone) {
      console.warn(`[Fonnte] Phone number is empty for order ${orderId}`);
      return;
    }

    let message = '';
    const frontendUrl = process.env.FRONTEND_URL || 'https://sugarac.com';

    if (type === 'DITUGASKAN') {
      message = `Halo Kak *${order.customerName}*,\n\nPesanan layanan AC Anda di *${businessName}* telah ditugaskan ke Teknisi Lapangan kami.\n\n*Detail Penugasan:*\n- *Order ID:* ${order.id}\n- *Teknisi:* ${order.assignedEmployeeName || 'Teknisi Kami'}\n- *Jadwal Pengerjaan:* ${order.scheduledDate} (${order.scheduledTime})\n\nTeknisi kami akan segera menghubungi Anda saat menuju ke lokasi. Terima kasih! 🙏❄️`;
    } else if (type === 'RESCHEDULE') {
      message = `Halo Kak *${order.customerName}*,\n\nTerdapat usulan perubahan jadwal dari admin *${businessName}* untuk pesanan Anda (Order ID: ${order.id}).\n\n*Rincian Perubahan Jadwal:*\n- *Jadwal Lama:* ${order.scheduledDate || '-'} pkl ${order.scheduledTime || '-'}\n- *Usulan Jadwal Baru:* *${order.proposedDate}* pkl *${order.proposedTime}*\n\nSilakan masuk ke akun Anda untuk menyetujui perubahan jadwal ini atau membatalkannya:\n👉 ${frontendUrl}/login\n\nTerima kasih! 🙏❄️`;
    } else {
      return;
    }

    const fonnteApiKey = process.env.FONNTE_API_KEY || 'obJEoZWPQy74AcesKRtx';
    console.log(`[Fonnte] Sending notification (${type}) to ${phone} for order ${orderId}...`);

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': fonnteApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target: phone,
        message: message
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`[Fonnte] Send notification (${type}) success:`, result);
    } else {
      const errText = await response.text();
      console.error(`[Fonnte] Send notification (${type}) failed:`, errText);
    }
  } catch (err) {
    console.error(`[Fonnte] Error sending notification (${type}):`, err);
  } finally {
    if (connection) connection.release();
  }
};

const sendWorkerNotification = async (orderId, workerId) => {
  let connection;
  try {
    connection = await pool.getConnection();

    // Get worker phone number and name
    const [workers] = await connection.query('SELECT phone, name FROM users WHERE id = ?', [workerId]);
    if (workers.length === 0) return;
    const worker = workers[0];

    let phone = worker.phone || '';
    phone = phone.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }
    if (!phone) {
      console.warn(`[Fonnte] Worker phone number is empty for worker ${workerId}`);
      return;
    }

    // Get order details
    const [orders] = await connection.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) return;
    const order = orders[0];

    const [settings] = await connection.query("SELECT value FROM settings WHERE key_name = 'business_name' AND (region_id = ? OR region_id IS NULL) ORDER BY region_id DESC LIMIT 1", [order.region_id || null]);
    const businessName = settings.length > 0 ? settings[0].value : 'CoolAir Pro';

    let acDetail = null;
    try {
      acDetail = order.acDetail ? JSON.parse(order.acDetail) : null;
    } catch (e) {
      console.error('Error parsing acDetail for worker notification:', e);
    }

    let serviceName = 'Jasa Layanan AC';
    if (Array.isArray(acDetail) && acDetail.length > 0) {
      serviceName = acDetail.map(s => `${s.quantity || 0}x ${s.serviceType === 'none' ? s.category : s.serviceType} (${s.acType || ''})`).join(', ');
    } else if (acDetail) {
      serviceName = `${acDetail.quantity || 0}x ${acDetail.serviceType === 'none' ? acDetail.category : acDetail.serviceType} (${acDetail.acType || ''})`;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://sugarac.com';

    const message = `Halo *${worker.name}*,\n\nAnda mendapatkan tugas pekerjaan baru di *${businessName}*! 🛠️❄️\n\n*Detail Pekerjaan:*\n- *Order ID:* ${order.id}\n- *Jadwal Kerja:* *${order.scheduledDate}* pukul *${order.scheduledTime}*\n- *Layanan:* ${serviceName}\n- *Pelanggan:* ${order.customerName} (${order.customerPhone})\n- *Alamat:* ${order.address}\n- *Catatan:* ${order.notes || '-'}\n\nSilakan masuk ke aplikasi Anda untuk melihat rincian lokasi GPS dan mengunggah foto sebelum/sesudah pengerjaan:\n👉 ${frontendUrl}/login\n\nSelamat bekerja dan utamakan keselamatan! 💪`;

    const fonnteApiKey = process.env.FONNTE_API_KEY || 'obJEoZWPQy74AcesKRtx';
    console.log(`[Fonnte] Sending worker notification to ${phone} for order ${orderId}...`);

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': fonnteApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target: phone,
        message: message
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`[Fonnte] Send worker notification success:`, result);
    } else {
      const errText = await response.text();
      console.error(`[Fonnte] Send worker notification failed:`, errText);
    }
  } catch (err) {
    console.error(`[Fonnte] Error sending worker notification:`, err);
  } finally {
    if (connection) connection.release();
  }
};

app.post('/api/orders', async (req, res) => {
  const {
    id, customerId, customerName, customerPhone, address, workerId, assignedEmployeeName,
    status, schedule, scheduledDate, scheduledTime, serviceIds, addonIds, acDetail, notes,
    serviceCost, addonsCost, totalPrice, totalCost, photoBefore, photoAfter,
    paymentMethod, paymentStatus, rating, ratingNotes, latitude, longitude, paymentProof, region_id,
    voucherCode, voucherDiscount
  } = req.body;

  try {
    const connection = await pool.getConnection();

    // Process and save base64 images locally
    const photoBeforeUrl = saveBase64Image(photoBefore, `order_${id}_before`);
    const photoAfterUrl = saveBase64Image(photoAfter, `order_${id}_after`);
    const paymentProofUrl = saveBase64Image(paymentProof, `order_${id}_proof`);

    let parsedAcDetail = acDetail;
    if (typeof acDetail === 'string') {
      try {
        parsedAcDetail = JSON.parse(acDetail);
      } catch (e) {}
    }
    if (Array.isArray(parsedAcDetail)) {
      parsedAcDetail = parsedAcDetail.map((ac, idx) => {
        const copyAc = { ...ac };
        if (copyAc.photoBefore) copyAc.photoBefore = saveBase64Image(copyAc.photoBefore, `order_${id}_ac_${idx}_before`);
        if (copyAc.photoAfter) copyAc.photoAfter = saveBase64Image(copyAc.photoAfter, `order_${id}_ac_${idx}_after`);
        return copyAc;
      });
    }

    await connection.query(
      `INSERT INTO orders (
        id, customerId, customerName, customerPhone, address, workerId, assignedEmployeeName,
        status, schedule, scheduledDate, scheduledTime, serviceIds, addonIds, acDetail, notes,
        serviceCost, addonsCost, totalPrice, totalCost, photoBefore, photoAfter,
        paymentMethod, paymentStatus, rating, ratingNotes, latitude, longitude, paymentProof, region_id,
        voucher_code, voucher_discount
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`,
      [
        id, customerId, customerName, customerPhone, address, workerId, assignedEmployeeName,
        status, schedule, scheduledDate, scheduledTime,
        JSON.stringify(serviceIds), JSON.stringify(addonIds), JSON.stringify(parsedAcDetail), notes,
        serviceCost || 0, addonsCost || 0, totalPrice, totalCost,
        photoBeforeUrl, photoAfterUrl, paymentMethod, paymentStatus, rating, ratingNotes, latitude, longitude, paymentProofUrl || null, region_id || null,
        voucherCode || null, voucherDiscount ? Number(voucherDiscount) : 0
      ]
    );

    // Record voucher usage if applicable
    if (voucherCode) {
      const [vch] = await connection.query('SELECT id FROM vouchers WHERE code = ? AND region_id = ?', [voucherCode, region_id]);
      if (vch.length > 0) {
        await connection.query(
          'INSERT INTO voucher_usages (voucher_id, user_id, order_id) VALUES (?, ?, ?)',
          [vch[0].id, customerId, id]
        );
      }
    }
    await syncOrderAddonTransactions(connection, id);
    await recalculateOrderMargin(connection, id);
    connection.release();
    await logActivity(req, 'Membuat Pesanan', `Membuat pesanan baru untuk ${customerName} (ID: ${id})`);
    if (status === 'SELESAI') {
      sendFonnteInvoice(id).catch(err => console.error('Error auto-sending Fonnte invoice:', err));
    }
    if (status === 'DITUGASKAN' && workerId) {
      sendWorkerNotification(id, workerId).catch(err => console.error('Error auto-sending Fonnte worker notification on create:', err));
    }
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
      acDetail: parsedAcDetail,
      notes,
      serviceCost,
      addonsCost,
      totalPrice,
      totalCost,
      photoBefore: photoBeforeUrl,
      photoAfter: photoAfterUrl,
      paymentMethod,
      paymentStatus,
      rating,
      ratingNotes,
      latitude,
      longitude,
      paymentProof: paymentProofUrl,
      voucher_code: voucherCode || null,
      voucher_discount: voucherDiscount ? Number(voucherDiscount) : 0,
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
    paymentMethod, paymentStatus, rating, ratingNotes, acDetail, serviceCost, addonsCost, totalCost, addonsUsed,
    scheduledDate, scheduledTime, proposedDate, proposedTime, rescheduleStatus, cancelReason, workerCancelReason,
    invoiceSent, paymentProof
  } = req.body;
  let connection;
  try {
    connection = await pool.getConnection();

    // Process base64 photo variables
    let photoBeforeUrl = photoBefore;
    let photoAfterUrl = photoAfter;
    let paymentProofUrl = paymentProof;
    let parsedAcDetail = acDetail;

    if (photoBefore !== undefined) photoBeforeUrl = saveBase64Image(photoBefore, `order_${id}_before`);
    if (photoAfter !== undefined) photoAfterUrl = saveBase64Image(photoAfter, `order_${id}_after`);
    if (paymentProof !== undefined) paymentProofUrl = saveBase64Image(paymentProof, `order_${id}_proof`);

    if (acDetail !== undefined) {
      if (typeof acDetail === 'string') {
        try {
          parsedAcDetail = JSON.parse(acDetail);
        } catch (e) {}
      }
      if (Array.isArray(parsedAcDetail)) {
        parsedAcDetail = parsedAcDetail.map((ac, idx) => {
          const copyAc = { ...ac };
          if (copyAc.photoBefore) copyAc.photoBefore = saveBase64Image(copyAc.photoBefore, `order_${id}_ac_${idx}_before`);
          if (copyAc.photoAfter) copyAc.photoAfter = saveBase64Image(copyAc.photoAfter, `order_${id}_ac_${idx}_after`);
          return copyAc;
        });
      }
    }

    // Get existing order status before update to detect transitions
    const [existingOrders] = await connection.query('SELECT status, rescheduleStatus FROM orders WHERE id = ?', [id]);
    const oldOrder = existingOrders.length > 0 ? existingOrders[0] : null;

    let finalPaymentUrl = undefined;
    let finalPaymentInvoiceId = undefined;

    if (paymentMethod === 'TRANSFER') {
      try {
        const [existing] = await connection.query(
          'SELECT paymentUrl, paymentInvoiceId, totalCost, serviceCost, addonsCost, customerName, customerPhone, acDetail, addonsUsed, voucher_code, voucher_discount FROM orders WHERE id = ?',
          [id]
        );
        if (existing.length > 0) {
          const orderData = existing[0];
          const discount = Number(orderData.voucher_discount || 0);
          const amount = Math.max(0, Number(orderData.serviceCost || 0) + Number(orderData.addonsCost || 0) - discount);

          let reuseInvoice = false;
          if (orderData.paymentUrl && orderData.paymentInvoiceId) {
            const xenditApiKey = process.env.XENDIT_SECRET_KEY;
            if (xenditApiKey) {
              try {
                const authHeader = 'Basic ' + Buffer.from(xenditApiKey + ':').toString('base64');
                const xenditResponse = await fetch(`https://api.xendit.co/v2/invoices/${orderData.paymentInvoiceId}`, {
                  method: 'GET',
                  headers: {
                    'Authorization': authHeader
                  }
                });
                if (xenditResponse.ok) {
                  const xenditData = await xenditResponse.json();
                  if (Number(xenditData.amount) === amount && xenditData.status !== 'EXPIRED') {
                    reuseInvoice = true;
                    finalPaymentUrl = orderData.paymentUrl;
                    finalPaymentInvoiceId = orderData.paymentInvoiceId;
                    console.log(`Reusing existing Xendit invoice for order ${id} as amount matches: ${amount}`);
                  } else {
                    console.log(`Xendit invoice amount mismatch or expired. (Xendit: ${xenditData.amount}, Current: ${amount}). Regenerating invoice...`);
                  }
                }
              } catch (e) {
                console.error('Error verifying existing Xendit invoice:', e);
              }
            }
          }

          if (!reuseInvoice) {
            const customerName = orderData.customerName || 'Pelanggan';
            let customerPhone = orderData.customerPhone || '';
            customerPhone = customerPhone.replace(/[^0-9]/g, '');
            if (customerPhone.startsWith('0')) {
              customerPhone = '62' + customerPhone.substring(1);
            }

            // Build itemized items list for Xendit
            const items = [];

            // Add basic service
            let acDetail = null;
            try {
              acDetail = orderData.acDetail ? JSON.parse(orderData.acDetail) : null;
            } catch (e) {
              console.error('Error parsing acDetail for Xendit invoice:', e);
            }

            if (Array.isArray(acDetail) && acDetail.length > 0) {
              const serviceNames = acDetail.map(s => `${s.quantity}x ${s.serviceType === 'none' ? s.category : s.serviceType}`).join(', ');
              items.push({
                name: serviceNames.substring(0, 255),
                quantity: 1,
                price: Number(orderData.serviceCost) || 0,
                category: 'Service AC'
              });
            } else if (acDetail) {
              const serviceName = `${acDetail.quantity}x ${acDetail.serviceType === 'none' ? acDetail.category : acDetail.serviceType}`;
              items.push({
                name: serviceName.substring(0, 255),
                quantity: 1,
                price: Number(orderData.serviceCost) || 0,
                category: 'Service AC'
              });
            } else {
              items.push({
                name: `Jasa Layanan AC`,
                quantity: 1,
                price: Number(orderData.serviceCost) || 0,
                category: 'Service AC'
              });
            }

            // Add addons/spareparts
            let addonsUsed = [];
            try {
              addonsUsed = orderData.addonsUsed ? JSON.parse(orderData.addonsUsed) : [];
            } catch (e) {
              console.error('Error parsing addonsUsed for Xendit invoice:', e);
            }

            if (Array.isArray(addonsUsed) && addonsUsed.length > 0) {
              addonsUsed.forEach(ad => {
                items.push({
                  name: `Tambahan: ${ad.name}`.substring(0, 255),
                  quantity: Number(ad.quantity) || 1,
                  price: Number(ad.price) || 0,
                  category: 'Sparepart/Addons'
                });
              });
            }

            if (discount > 0) {
              items.push({
                name: `Diskon Voucher: ${orderData.voucher_code || 'PROMO'}`,
                quantity: 1,
                price: -discount,
                category: 'Diskon'
              });
            }

            const xenditApiKey = process.env.XENDIT_SECRET_KEY;
            if (xenditApiKey) {
              const authHeader = 'Basic ' + Buffer.from(xenditApiKey + ':').toString('base64');
              console.log(`Sending invoice request to Xendit for order ${id} with amount ${amount}...`);
              const xenditResponse = await fetch('https://api.xendit.co/v2/invoices', {
                method: 'POST',
                headers: {
                  'Authorization': authHeader,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  external_id: id,
                  amount: amount,
                  description: `Pembayaran Jasa Cuci AC CoolAir Pro - Order ID: ${id}`,
                  invoice_duration: 86400, // 24 hours
                  customer: {
                    given_names: customerName,
                    mobile_number: customerPhone || undefined
                  },
                  items: items,
                  success_redirect_url: process.env.FRONTEND_URL || 'https://sugarac.com',
                  failure_redirect_url: process.env.FRONTEND_URL || 'https://sugarac.com'
                })
              });

              if (xenditResponse.ok) {
                const xenditData = await xenditResponse.json();
                finalPaymentUrl = xenditData.invoice_url;
                finalPaymentInvoiceId = xenditData.id;
                console.log(`Xendit Invoice created: ${finalPaymentUrl}`);
              } else {
                const errorData = await xenditResponse.text();
                console.error('Xendit invoice generation failed:', errorData);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error creating Xendit invoice:', err);
      }
    }

    // Support both workerId and assignedTo (assignedTo is the frontend name, workerId is the database name)
    const staffId = workerId || assignedTo;

    // Build dynamic update query
    let updateFields = [];
    let updateValues = [];

    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
      if (status === 'SELESAI') {
        updateFields.push('completedAt = NOW()');
      }
    }
    if (staffId !== undefined) { updateFields.push('workerId = ?'); updateValues.push(staffId); }
    if (assignedEmployeeName !== undefined) { updateFields.push('assignedEmployeeName = ?'); updateValues.push(assignedEmployeeName); }
    if (notes !== undefined) { updateFields.push('notes = ?'); updateValues.push(notes); }
    if (totalPrice !== undefined) { updateFields.push('totalPrice = ?'); updateValues.push(totalPrice); }
    if (photoBefore !== undefined) { updateFields.push('photoBefore = ?'); updateValues.push(photoBeforeUrl); }
    if (photoAfter !== undefined) { updateFields.push('photoAfter = ?'); updateValues.push(photoAfterUrl); }
    if (paymentMethod !== undefined) { updateFields.push('paymentMethod = ?'); updateValues.push(paymentMethod); }
    if (paymentStatus !== undefined) { updateFields.push('paymentStatus = ?'); updateValues.push(paymentStatus); }
    if (rating !== undefined) { updateFields.push('rating = ?'); updateValues.push(rating); }
    if (ratingNotes !== undefined) { updateFields.push('ratingNotes = ?'); updateValues.push(ratingNotes); }
    if (acDetail !== undefined) { updateFields.push('acDetail = ?'); updateValues.push(JSON.stringify(parsedAcDetail)); }
    if (serviceCost !== undefined) { updateFields.push('serviceCost = ?'); updateValues.push(serviceCost); }
    if (addonsCost !== undefined) { updateFields.push('addonsCost = ?'); updateValues.push(addonsCost); }
    if (totalCost !== undefined) { updateFields.push('totalCost = ?'); updateValues.push(totalCost); }
    if (addonsUsed !== undefined) { updateFields.push('addonsUsed = ?'); updateValues.push(JSON.stringify(addonsUsed)); }
    if (scheduledDate !== undefined) { updateFields.push('scheduledDate = ?'); updateValues.push(scheduledDate); }
    if (scheduledTime !== undefined) { updateFields.push('scheduledTime = ?'); updateValues.push(scheduledTime); }
    if (proposedDate !== undefined) { updateFields.push('proposedDate = ?'); updateValues.push(proposedDate); }
    if (proposedTime !== undefined) { updateFields.push('proposedTime = ?'); updateValues.push(proposedTime); }
    if (rescheduleStatus !== undefined) { updateFields.push('rescheduleStatus = ?'); updateValues.push(rescheduleStatus); }
    if (cancelReason !== undefined) { updateFields.push('cancelReason = ?'); updateValues.push(cancelReason); }
    if (workerCancelReason !== undefined) { updateFields.push('workerCancelReason = ?'); updateValues.push(workerCancelReason); }
    if (invoiceSent !== undefined) { updateFields.push('invoiceSent = ?'); updateValues.push(invoiceSent ? 1 : 0); }
    if (paymentProof !== undefined) { updateFields.push('paymentProof = ?'); updateValues.push(paymentProofUrl); }

    if (finalPaymentUrl !== undefined) { updateFields.push('paymentUrl = ?'); updateValues.push(finalPaymentUrl); }
    if (finalPaymentInvoiceId !== undefined) { updateFields.push('paymentInvoiceId = ?'); updateValues.push(finalPaymentInvoiceId); }

    updateFields.push('updatedAt = NOW()');
    updateValues.push(id);

    if (updateFields.length > 1) {
      await connection.query(
        `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
      await logActivity(req, 'Memperbarui Pesanan', `Memperbarui pesanan ID: ${id}`);
    }

    await syncOrderAddonTransactions(connection, id);
    await recalculateOrderMargin(connection, id);



    const [updatedOrder] = await connection.query('SELECT * FROM orders WHERE id = ?', [id]);

    if (updatedOrder.length > 0) {
      const order = updatedOrder[0];
      if (order.status === 'SELESAI' && order.invoiceSent !== 1) {
        sendFonnteInvoice(id).catch(err => console.error('Error auto-sending Fonnte invoice:', err));
      }

      // Auto notifications on transitions
      if (oldOrder) {
        if (order.status === 'DITUGASKAN' && oldOrder.status !== 'DITUGASKAN') {
          sendFonnteNotification(id, 'DITUGASKAN').catch(err => console.error('Error sending DITUGASKAN notification:', err));
        }
        if (order.rescheduleStatus === 'PENDING' && oldOrder.rescheduleStatus !== 'PENDING') {
          sendFonnteNotification(id, 'RESCHEDULE').catch(err => console.error('Error sending RESCHEDULE notification:', err));
        }

        // Worker notifications (DITUGASKAN or worker reassignment)
        const statusBecameDitugaskan = order.status === 'DITUGASKAN' && oldOrder.status !== 'DITUGASKAN';
        const workerChanged = order.status === 'DITUGASKAN' && order.workerId && order.workerId !== oldOrder.workerId;

        if ((statusBecameDitugaskan || workerChanged) && order.workerId) {
          sendWorkerNotification(id, order.workerId).catch(err => console.error('Error sending Fonnte worker notification:', err));
        }
      }

      // -------------------------------------------------------------
      // AUTO-INCREMENT SALARY & POINTS BALANCE
      // -------------------------------------------------------------
      if (oldOrder && order.status === 'SELESAI' && oldOrder.status !== 'SELESAI' && !oldOrder.completedAt) {
        try {
          const workerIds = [];
          if (order.workerId) workerIds.push(order.workerId);

          for (const wId of workerIds) {
            const [users] = await connection.query(`
              SELECT u.is_leader, sg.leader_point_reward, sg.member_point_reward,
                     sg.leader_daily_base_salary, sg.leader_daily_travel_allowance,
                     sg.member_daily_base_salary, sg.member_daily_travel_allowance
              FROM users u
              LEFT JOIN staff_grades sg ON u.grade_id = sg.id
              WHERE u.id = ?
            `, [wId]);

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
              const [completedToday] = await connection.query(`
                SELECT COUNT(*) as cnt 
                FROM orders o
                WHERE o.workerId = ? 
                  AND o.status = 'SELESAI' 
                  AND DATE(o.completedAt) = CURDATE() 
                  AND o.id != ?
              `, [wId, order.id]);

              if (completedToday[0].cnt === 0) {
                const dailyBase = user.is_leader ? (Number(user.leader_daily_base_salary) || 0) : (Number(user.member_daily_base_salary) || 0);
                const dailyTravel = user.is_leader ? (Number(user.leader_daily_travel_allowance) || 0) : (Number(user.member_daily_travel_allowance) || 0);
                salaryEarned = dailyBase + dailyTravel;
              }

              if (pointsEarned > 0 || salaryEarned > 0) {
                await connection.query(`
                  UPDATE users 
                  SET points_balance = points_balance + ?, salary_balance = salary_balance + ? 
                  WHERE id = ?
                `, [pointsEarned, salaryEarned, wId]);
                console.log(`✅ Added ${pointsEarned} points and ${salaryEarned} salary for worker ${wId} on order ${id}`);
              }
            }
          }
        } catch (err) {
          console.error('Error updating salary/points balance:', err);
        }
      }
      // -------------------------------------------------------------

      const parsedOrder = {
        ...order,
        acDetail: order.acDetail ? JSON.parse(order.acDetail) : null,
        serviceIds: order.serviceIds ? JSON.parse(order.serviceIds) : [],
        addonIds: order.addonIds ? JSON.parse(order.addonIds) : [],
        addonsUsed: order.addonsUsed ? JSON.parse(order.addonsUsed) : []
      };
      res.json(parsedOrder);
    } else {
      res.json(req.body);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// ===== XENDIT WEBHOOK CALLBACK =====
app.post('/api/webhooks/xendit', async (req, res) => {
  const { status, external_id } = req.body;
  console.log(`📡 Xendit webhook received:`, req.body);

  if (status === 'PAID') {
    let connection;
    try {
      connection = await pool.getConnection();
      // Update paymentStatus to PAID, status to SELESAI, and set completedAt to NOW
      await connection.query(
        "UPDATE orders SET paymentStatus = 'PAID', status = 'SELESAI', completedAt = NOW() WHERE id = ?",
        [external_id]
      );
      await syncOrderAddonTransactions(connection, external_id);
      await recalculateOrderMargin(connection, external_id);
      console.log(`💰 Xendit payment received for order: ${external_id}. Order set to SELESAI.`);
      sendFonnteInvoice(external_id).catch(err => console.error('Error auto-sending Fonnte invoice on webhook:', err));
    } catch (err) {
      console.error('Error updating order on Xendit webhook:', err);
    } finally {
      if (connection) connection.release();
    }
  }
  res.json({ status: 'ok' });
});

// ===== CHECK PAYMENT STATUS DIRECTLY FROM XENDIT (For Localhost Webhook Bypass) =====
app.get('/api/orders/:id/payment-status', async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await pool.getConnection();
    const [orders] = await connection.query('SELECT paymentInvoiceId, paymentStatus, status FROM orders WHERE id = ?', [id]);

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    // Jika status di DB sudah PAID, langsung kembalikan
    if (order.paymentStatus === 'PAID') {
      return res.json({ paymentStatus: 'PAID', status: order.status });
    }

    const invoiceId = order.paymentInvoiceId;
    const xenditApiKey = process.env.XENDIT_SECRET_KEY;

    if (invoiceId && xenditApiKey) {
      const authHeader = 'Basic ' + Buffer.from(xenditApiKey + ':').toString('base64');
      const xenditResponse = await fetch(`https://api.xendit.co/v2/invoices/${invoiceId}`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader
        }
      });

      if (xenditResponse.ok) {
        const xenditData = await xenditResponse.json();
        console.log(`Checking Xendit status for ${invoiceId}: ${xenditData.status}`);

        if (xenditData.status === 'PAID' || xenditData.status === 'SETTLED') {
          // Update status pembayaran & pesanan di database
          await connection.query(
            "UPDATE orders SET paymentStatus = 'PAID', status = 'SELESAI', completedAt = NOW() WHERE id = ?",
            [id]
          );
          await syncOrderAddonTransactions(connection, id);
          await recalculateOrderMargin(connection, id);
          console.log(`💰 Verified: Xendit payment successful for order ${id}. Status set to SELESAI.`);
          sendFonnteInvoice(id).catch(err => console.error('Error auto-sending Fonnte invoice on payment verification:', err));
          return res.json({ paymentStatus: 'PAID', status: 'SELESAI' });
        }
      }
    }

    res.json({ paymentStatus: order.paymentStatus, status: order.status });
  } catch (err) {
    console.error('Error checking payment status:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// ===== SEND FONNTE INVOICE DIRECTLY =====
app.post('/api/orders/:id/send-invoice', async (req, res) => {
  const { id } = req.params;
  try {
    await sendFonnteInvoice(id, true);
    res.json({ success: true, message: 'Invoice sent successfully via Fonnte' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== AC MODELS API =====
app.get('/api/models', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    let query = 'SELECT * FROM ac_models';
    let params = [];
    if (req.query.region_id) {
       query += ' WHERE region_id = ?';
       params.push(req.query.region_id);
    }
    const [models] = await connection.query(query, params);
    connection.release();
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/models', verifyToken, async (req, res) => {
  const { id, name, manufacturer, region_id } = req.body;
  // Fallback ke region_id user jika tidak ada di body dan user bukan Owner Pusat (null region)
  const finalRegionId = req.user && req.user.region_id ? req.user.region_id : (region_id || null);
  try {
    const connection = await pool.getConnection();
    const newId = id || `model_${Date.now()}`;
    await connection.query(
      'INSERT INTO ac_models (id, name, manufacturer, region_id) VALUES (?, ?, ?, ?)',
      [newId, name, manufacturer || null, finalRegionId]
    );
    connection.release();
    await logActivity(req, 'Menambahkan Model AC', `Menambahkan model AC baru: ${name}`);
    res.status(201).json({ id: newId, name, manufacturer: manufacturer || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/models/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, manufacturer } = req.body;
  try {
    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE ac_models SET name = ?, manufacturer = ? WHERE id = ?',
      [name, manufacturer || null, id]
    );
    const [model] = await connection.query('SELECT * FROM ac_models WHERE id = ?', [id]);
    connection.release();
    await logActivity(req, 'Memperbarui Model AC', `Memperbarui model AC: ${model[0]?.name || name}`);
    res.json(model[0] || { id, name, manufacturer: manufacturer || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== AC CATEGORIES API =====
app.get('/api/categories', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    let query = 'SELECT * FROM ac_categories';
    let params = [];
    if (req.query.region_id) {
       query += ' WHERE region_id = ?';
       params.push(req.query.region_id);
    }
    const [categories] = await connection.query(query, params);
    connection.release();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', verifyToken, async (req, res) => {
  const { id, name, description, icon, hasServices, region_id } = req.body;
  const finalRegionId = req.user && req.user.region_id ? req.user.region_id : (region_id || null);
  try {
    const connection = await pool.getConnection();
    const newId = id || `cat_${Date.now()}`;
    await connection.query(
      'INSERT INTO ac_categories (id, name, description, icon, hasServices, region_id) VALUES (?, ?, ?, ?, ?, ?)',
      [newId, name, description || null, icon || null, hasServices !== undefined ? hasServices : true, finalRegionId]
    );
    connection.release();
    await logActivity(req, 'Menambahkan Kategori Layanan', `Menambahkan kategori baru: ${name}`);
    res.status(201).json({ id: newId, name, description: description || null, hasServices: hasServices !== undefined ? hasServices : true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, description, icon, hasServices } = req.body;
  try {
    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE ac_categories SET name = ?, description = ?, icon = ?, hasServices = ? WHERE id = ?',
      [name, description || null, icon || null, hasServices !== undefined ? hasServices : true, id]
    );
    const [category] = await connection.query('SELECT * FROM ac_categories WHERE id = ?', [id]);
    connection.release();
    await logActivity(req, 'Memperbarui Kategori Layanan', `Memperbarui kategori: ${category[0]?.name || name}`);
    res.json(category[0] || { id, name, description: description || null, hasServices: hasServices !== undefined ? hasServices : true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== AC SERVICES API =====
app.get('/api/services', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    let query = 'SELECT * FROM ac_services';
    let params = [];
    if (req.query.region_id) {
       query += ' WHERE region_id = ?';
       params.push(req.query.region_id);
    }
    const [services] = await connection.query(query, params);
    connection.release();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services', async (req, res) => {
  const { id, name, description, duration, categoryId } = req.body;
  try {
    const connection = await pool.getConnection();
    const newId = id || `svc_${Date.now()}`;
    await connection.query(
      'INSERT INTO ac_services (id, categoryId, name, description, duration) VALUES (?, ?, ?, ?, ?)',
      [newId, categoryId || null, name, description || null, duration || null]
    );
    connection.release();
    await logActivity(req, 'Menambahkan Layanan AC', `Menambahkan layanan baru: ${name}`);
    res.status(201).json({ id: newId, categoryId: categoryId || null, name, description: description || null, duration: duration || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/services/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, duration, categoryId } = req.body;
  try {
    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE ac_services SET name = ?, description = ?, duration = ?, categoryId = ? WHERE id = ?',
      [name, description || null, duration || null, categoryId || null, id]
    );
    const [service] = await connection.query('SELECT * FROM ac_services WHERE id = ?', [id]);
    connection.release();
    await logActivity(req, 'Memperbarui Layanan AC', `Memperbarui layanan: ${service[0]?.name || name}`);
    res.json(service[0] || { id, categoryId: categoryId || null, name, description: description || null, duration: duration || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== AC SERVICE PRICES API =====
app.get('/api/service-prices', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [prices] = await connection.query('SELECT * FROM ac_service_prices');
    connection.release();
    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/service-prices/bulk', async (req, res) => {
  const { serviceId, prices } = req.body;
  if (!serviceId || !Array.isArray(prices)) {
    return res.status(400).json({ error: 'Valid serviceId and prices array required' });
  }
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.query('DELETE FROM ac_service_prices WHERE serviceId = ?', [serviceId]);

    for (const p of prices) {
      if (p.modelId && p.price !== undefined) {
        const newId = `price_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await connection.query(
          'INSERT INTO ac_service_prices (id, serviceId, modelId, price) VALUES (?, ?, ?, ?)',
          [newId, serviceId, p.modelId, Number(p.price)]
        );
      }
    }

    await connection.commit();
    connection.release();

    await logActivity(req, 'Mengatur Harga Layanan', `Mengatur harga per model untuk layanan ID: ${serviceId}`);
    res.json({ success: true, message: 'Harga layanan berhasil diperbarui' });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    res.status(500).json({ error: error.message });
  }
});

// ===== AC ADDONS API =====
app.get('/api/addons', async (req, res) => {
  const user = getOptionalUser(req);
  const userRole = user?.role ? user.role.toUpperCase() : '';
  const { region_id } = req.query;

  try {
    const connection = await pool.getConnection();
    let query = `
      SELECT a.*, 
             CAST(COALESCE(SUM(CASE WHEN t.type = 'masuk' THEN t.qty ELSE -t.qty END), 0) AS SIGNED) AS stock
      FROM ac_addons a
      LEFT JOIN ac_addon_transactions t ON a.id = t.addonId
      WHERE 1=1
    `;
    const params = [];
    if (userRole === 'ADMIN' || userRole === 'KEUANGAN') {
      if (user.region_id) {
        query += ' AND a.region_id = ?';
        params.push(user.region_id);
      }
    } else if (region_id) {
      query += ' AND a.region_id = ?';
      params.push(region_id);
    }

    query += ' GROUP BY a.id';
    const [addons] = await connection.query(query, params);
    connection.release();
    res.json(addons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/addons', verifyToken, async (req, res) => {
  const userRole = req.user.role ? req.user.role.toUpperCase() : '';
  if (userRole !== 'ADMIN' && userRole !== 'OWNER' && userRole !== 'KEUANGAN') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { id, name, description, price, hpp } = req.body;
  let { region_id } = req.body;

  if (userRole === 'ADMIN' || userRole === 'KEUANGAN') {
    region_id = req.user.region_id;
  }

  if (!region_id) {
    return res.status(400).json({ error: 'Wilayah (region_id) wajib ditentukan.' });
  }

  try {
    const connection = await pool.getConnection();
    const newId = id || `addon_${Date.now()}`;
    await connection.query(
      'INSERT INTO ac_addons (id, name, description, price, hpp, region_id) VALUES (?, ?, ?, ?, ?, ?)',
      [newId, name, description || null, price || 0, hpp || 0, region_id]
    );
    connection.release();
    await logActivity(req, 'Menambahkan Addon/Sparepart', `Menambahkan addon baru: ${name}`);
    res.status(201).json({ id: newId, name, description: description || null, price: price || 0, hpp: hpp || 0, region_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/addons/:id', verifyToken, async (req, res) => {
  const userRole = req.user.role ? req.user.role.toUpperCase() : '';
  if (userRole !== 'ADMIN' && userRole !== 'OWNER' && userRole !== 'KEUANGAN') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { id } = req.params;
  const { name, description, price, hpp } = req.body;
  let connection;
  try {
    connection = await pool.getConnection();
    const [existing] = await connection.query('SELECT * FROM ac_addons WHERE id = ?', [id]);
    if (existing.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Addon tidak ditemukan.' });
    }
    if ((userRole === 'ADMIN' || userRole === 'KEUANGAN') && req.user.region_id && existing[0].region_id !== req.user.region_id) {
      connection.release();
      return res.status(403).json({ error: 'Anda tidak memiliki hak akses untuk wilayah ini.' });
    }

    await connection.query(
      'UPDATE ac_addons SET name = ?, description = ?, price = ?, hpp = ? WHERE id = ?',
      [name, description || null, price || 0, hpp || 0, id]
    );
    const [addon] = await connection.query('SELECT * FROM ac_addons WHERE id = ?', [id]);
    connection.release();
    await logActivity(req, 'Memperbarui Addon/Sparepart', `Memperbarui addon: ${addon[0]?.name || name}`);
    res.json(addon[0] || { id, name, description: description || null, price: price || 0, hpp: hpp || 0 });
  } catch (error) {
    if (connection) connection.release();
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/addons/purchase', verifyToken, async (req, res) => {
  const userRole = req.user.role ? req.user.role.toUpperCase() : '';
  if (userRole !== 'ADMIN' && userRole !== 'OWNER' && userRole !== 'KEUANGAN') {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { addonId, qty, price, notes } = req.body;
  if (!addonId || !qty || qty <= 0 || price === undefined || price < 0) {
    return res.status(400).json({ error: 'Valid addonId, positive qty, and non-negative price are required.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [existing] = await connection.query('SELECT * FROM ac_addons WHERE id = ?', [addonId]);
    if (existing.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Addon tidak ditemukan.' });
    }
    if ((userRole === 'ADMIN' || userRole === 'KEUANGAN') && req.user.region_id && existing[0].region_id !== req.user.region_id) {
      connection.release();
      return res.status(403).json({ error: 'Anda tidak memiliki hak akses untuk wilayah ini.' });
    }

    await connection.beginTransaction();

    const { stock: currentStock, hpp: currentHpp } = await getAddonStockAndHpp(connection, addonId);

    const qtyNum = Number(qty);
    const priceNum = Number(price);
    const currentStockNum = Number(currentStock);
    const currentHppNum = Number(currentHpp);

    let newHpp = priceNum;
    if (currentStockNum > 0) {
      newHpp = ((currentStockNum * currentHppNum) + (qtyNum * priceNum)) / (currentStockNum + qtyNum);
    }

    newHpp = Math.round(newHpp * 100) / 100;

    await connection.query(
      "UPDATE ac_addons SET hpp = ? WHERE id = ?",
      [newHpp, addonId]
    );

    await connection.query(
      "INSERT INTO ac_addon_transactions (addonId, type, qty, price, notes) VALUES (?, 'masuk', ?, ?, ?)",
      [addonId, qtyNum, priceNum, notes || 'Pembelian/Restock Addon']
    );

    await connection.commit();
    await logActivity(req, 'Restock Addon/Sparepart', `Membeli ${qtyNum} unit addon (ID: ${addonId}) @ Rp ${priceNum.toLocaleString('id-ID')} (HPP Baru: Rp ${newHpp.toLocaleString('id-ID')})`);

    res.json({
      success: true,
      newStock: currentStockNum + qtyNum,
      newHpp: newHpp
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error recording addon purchase:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

app.post('/api/addons/adjust', verifyToken, async (req, res) => {
  const userRole = req.user.role ? req.user.role.toUpperCase() : '';
  if (userRole !== 'ADMIN' && userRole !== 'OWNER' && userRole !== 'KEUANGAN') {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { adjustments } = req.body;
  if (!adjustments || !Array.isArray(adjustments)) {
    return res.status(400).json({ error: 'adjustments array is required.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    for (const adj of adjustments) {
      const { addonId, systemStock, physicalStock, notes } = adj;
      const [existing] = await connection.query('SELECT * FROM ac_addons WHERE id = ?', [addonId]);
      if (existing.length === 0) {
        continue;
      }
      
      const diff = Number(physicalStock) - Number(systemStock);
      if (diff === 0) continue;

      const type = diff > 0 ? 'masuk' : 'keluar';
      const qty = Math.abs(diff);
      const hpp = Number(existing[0].hpp) || 0;

      await connection.query(
        "INSERT INTO ac_addon_transactions (addonId, type, qty, price, notes) VALUES (?, ?, ?, ?, ?)",
        [addonId, type, qty, hpp, notes || `Penyesuaian Stok (${diff > 0 ? 'Kelebihan' : 'Kekurangan'} Fisik)`]
      );
    }

    await connection.commit();
    await logActivity(req, 'Penyesuaian Stok Addon', `Melakukan penyesuaian stok untuk ${adjustments.length} item.`);

    res.json({ success: true });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error recording stock adjustments:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

app.get('/api/addons/transactions', verifyToken, async (req, res) => {
  const userRole = req.user.role ? req.user.role.toUpperCase() : '';
  if (userRole !== 'ADMIN' && userRole !== 'OWNER' && userRole !== 'KEUANGAN') {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { addonId } = req.query;
  let connection;
  try {
    connection = await pool.getConnection();
    let query = `
      SELECT t.*, a.name AS addonName
      FROM ac_addon_transactions t
      JOIN ac_addons a ON t.addonId = a.id
      WHERE 1=1
    `;
    let params = [];
    if (addonId) {
      query += " AND t.addonId = ?";
      params.push(addonId);
    }
    
    // Filter by region for admins or finance
    if ((userRole === 'ADMIN' || userRole === 'KEUANGAN') && req.user.region_id) {
      query += " AND a.region_id = ?";
      params.push(req.user.region_id);
    }
    
    query += " ORDER BY t.createdAt DESC";

    const [transactions] = await connection.query(query, params);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching addon transactions:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// ===== DELETE ENDPOINTS =====
app.delete('/api/models/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await pool.getConnection();
    const [model] = await connection.query('SELECT name FROM ac_models WHERE id = ?', [id]);
    const itemName = model.length > 0 ? model[0].name : id;

    await connection.query('DELETE FROM ac_models WHERE id = ?', [id]);
    connection.release();
    await logActivity(req, 'Menghapus Model AC', `Menghapus model AC: ${itemName}`);
    res.json({ message: 'Model deleted successfully', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await pool.getConnection();
    const [category] = await connection.query('SELECT name FROM ac_categories WHERE id = ?', [id]);
    const itemName = category.length > 0 ? category[0].name : id;

    await connection.query('DELETE FROM ac_categories WHERE id = ?', [id]);
    connection.release();
    await logActivity(req, 'Menghapus Kategori Layanan', `Menghapus kategori: ${itemName}`);
    res.json({ message: 'Category deleted successfully', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await pool.getConnection();
    const [service] = await connection.query('SELECT name FROM ac_services WHERE id = ?', [id]);
    const itemName = service.length > 0 ? service[0].name : id;

    await connection.query('DELETE FROM ac_services WHERE id = ?', [id]);
    connection.release();
    await logActivity(req, 'Menghapus Layanan AC', `Menghapus layanan: ${itemName}`);
    res.json({ message: 'Service deleted successfully', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/addons/:id', verifyToken, async (req, res) => {
  const userRole = req.user.role ? req.user.role.toUpperCase() : '';
  if (userRole !== 'ADMIN' && userRole !== 'OWNER' && userRole !== 'KEUANGAN') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { id } = req.params;
  let connection;
  try {
    connection = await pool.getConnection();
    const [existing] = await connection.query('SELECT * FROM ac_addons WHERE id = ?', [id]);
    if (existing.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Addon tidak ditemukan.' });
    }
    if ((userRole === 'ADMIN' || userRole === 'KEUANGAN') && req.user.region_id && existing[0].region_id !== req.user.region_id) {
      connection.release();
      return res.status(403).json({ error: 'Anda tidak memiliki hak akses untuk wilayah ini.' });
    }

    await connection.query('DELETE FROM ac_addons WHERE id = ?', [id]);
    connection.release();
    await logActivity(req, 'Menghapus Addon/Sparepart', `Menghapus addon: ${existing[0].name}`);
    res.json({ message: 'Addon deleted successfully', id });
  } catch (error) {
    if (connection) connection.release();
    res.status(500).json({ error: error.message });
  }
});

// ===== FIXED ASSETS API =====
app.get('/api/fixed-assets', verifyToken, async (req, res) => {
  const userRole = req.user.role ? req.user.role.toUpperCase() : '';
  const { region_id } = req.query;
  let connection;
  try {
    connection = await pool.getConnection();
    let query = 'SELECT f.*, r.name as regionName FROM fixed_assets f JOIN regions r ON f.region_id = r.id WHERE 1=1';
    const params = [];
    if (userRole === 'ADMIN' || userRole === 'KEUANGAN') {
      if (req.user.region_id) {
        query += ' AND f.region_id = ?';
        params.push(req.user.region_id);
      }
    } else if (region_id) {
      query += ' AND f.region_id = ?';
      params.push(region_id);
    }
    query += ' ORDER BY f.purchase_date DESC';
    const [rows] = await connection.query(query, params);
    connection.release();
    res.json(rows);
  } catch (error) {
    if (connection) connection.release();
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/fixed-assets', verifyToken, async (req, res) => {
  const userRole = req.user.role ? req.user.role.toUpperCase() : '';
  if (userRole !== 'ADMIN' && userRole !== 'OWNER' && userRole !== 'KEUANGAN') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { name, purchase_date, purchase_price, description } = req.body;
  let { region_id } = req.body;
  
  if (userRole === 'ADMIN' || userRole === 'KEUANGAN') {
    region_id = req.user.region_id;
  }
  if (!region_id) {
    return res.status(400).json({ error: 'Wilayah (region_id) wajib ditentukan.' });
  }
  if (!name || !purchase_date || purchase_price === undefined) {
    return res.status(400).json({ error: 'Nama, tanggal pembelian, dan harga wajib diisi.' });
  }
  
  let connection;
  try {
    connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO fixed_assets (region_id, name, purchase_date, purchase_price, description) VALUES (?, ?, ?, ?, ?)',
      [region_id, name, purchase_date, purchase_price, description || null]
    );
    const insertId = result.insertId;
    connection.release();
    await logActivity(req, 'Menambahkan Aset Tetap', `Menambahkan aset tetap baru: ${name} di wilayah ${region_id}`);
    res.status(201).json({ id: insertId, region_id, name, purchase_date, purchase_price, description });
  } catch (error) {
    if (connection) connection.release();
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/fixed-assets/:id', verifyToken, async (req, res) => {
  const userRole = req.user.role ? req.user.role.toUpperCase() : '';
  if (userRole !== 'ADMIN' && userRole !== 'OWNER' && userRole !== 'KEUANGAN') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { id } = req.params;
  const { name, purchase_date, purchase_price, description } = req.body;
  let connection;
  try {
    connection = await pool.getConnection();
    const [existing] = await connection.query('SELECT * FROM fixed_assets WHERE id = ?', [id]);
    if (existing.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Aset tetap tidak ditemukan.' });
    }
    if ((userRole === 'ADMIN' || userRole === 'KEUANGAN') && req.user.region_id && existing[0].region_id !== req.user.region_id) {
      connection.release();
      return res.status(403).json({ error: 'Anda tidak memiliki hak akses untuk wilayah ini.' });
    }
    
    await connection.query(
      'UPDATE fixed_assets SET name = ?, purchase_date = ?, purchase_price = ?, description = ? WHERE id = ?',
      [name, purchase_date, purchase_price, description || null, id]
    );
    connection.release();
    await logActivity(req, 'Memperbarui Aset Tetap', `Memperbarui aset tetap: ${name}`);
    res.json({ id, name, purchase_date, purchase_price, description });
  } catch (error) {
    if (connection) connection.release();
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/fixed-assets/:id', verifyToken, async (req, res) => {
  const userRole = req.user.role ? req.user.role.toUpperCase() : '';
  if (userRole !== 'ADMIN' && userRole !== 'OWNER' && userRole !== 'KEUANGAN') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { id } = req.params;
  let connection;
  try {
    connection = await pool.getConnection();
    const [existing] = await connection.query('SELECT * FROM fixed_assets WHERE id = ?', [id]);
    if (existing.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Aset tetap tidak ditemukan.' });
    }
    if ((userRole === 'ADMIN' || userRole === 'KEUANGAN') && req.user.region_id && existing[0].region_id !== req.user.region_id) {
      connection.release();
      return res.status(403).json({ error: 'Anda tidak memiliki hak akses untuk wilayah ini.' });
    }
    await connection.query('DELETE FROM fixed_assets WHERE id = ?', [id]);
    connection.release();
    await logActivity(req, 'Menghapus Aset Tetap', `Menghapus aset tetap: ${existing[0].name}`);
    res.json({ message: 'Fixed asset deleted successfully', id });
  } catch (error) {
    if (connection) connection.release();
    res.status(500).json({ error: error.message });
  }
});

// ===== VOUCHERS API =====

// Get all vouchers (filtered by region_id for branch admins)
app.get('/api/vouchers', verifyToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    let query = 'SELECT vouchers.*, regions.name as regionName FROM vouchers JOIN regions ON vouchers.region_id = regions.id';
    let params = [];
    
    // Filter based on role and region_id
    if (req.user.role?.toUpperCase() === 'ADMIN' && req.user.region_id) {
      query += ' WHERE vouchers.region_id = ?';
      params.push(req.user.region_id);
    } else if (req.query.region_id) {
      query += ' WHERE vouchers.region_id = ?';
      params.push(req.query.region_id);
    }
    
    query += ' ORDER BY vouchers.createdAt DESC';
    const [rows] = await connection.query(query, params);
    connection.release();
    res.json(rows);
  } catch (error) {
    if (connection) connection.release();
    res.status(500).json({ error: error.message });
  }
});

// Create new voucher
app.post('/api/vouchers', verifyToken, async (req, res) => {
  // Only Admin or Owner can manage vouchers
  if (req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Akses ditolak.' });
  }
  
  const { code, name, discount_type, discount_value, min_order_amount, max_discount_amount, start_date, end_date, max_uses_total, new_user_only, region_id } = req.body;
  
  if (!code || !name || !discount_type || discount_value === undefined || !start_date || !end_date) {
    return res.status(400).json({ error: 'Mohon isi semua field wajib.' });
  }
  
  // Enforce region_id for branch admin
  const finalRegionId = req.user.role?.toUpperCase() === 'ADMIN' ? req.user.region_id : region_id;
  if (!finalRegionId) {
    return res.status(400).json({ error: 'Wilayah / cabang wajib ditentukan.' });
  }
  
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Check if code already exists in this region
    const [existing] = await connection.query('SELECT id FROM vouchers WHERE code = ? AND region_id = ?', [code.toUpperCase().trim(), finalRegionId]);
    if (existing.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'Kode voucher ini sudah digunakan di wilayah ini.' });
    }
    
    const newId = 'vch_' + Date.now();
    await connection.query(
      `INSERT INTO vouchers (
        id, code, name, discount_type, discount_value, min_order_amount, max_discount_amount, 
        start_date, end_date, max_uses_total, new_user_only, region_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId, code.toUpperCase().trim(), name.trim(), discount_type, Number(discount_value),
        Number(min_order_amount || 0), max_discount_amount ? Number(max_discount_amount) : null,
        start_date, end_date, max_uses_total ? Number(max_uses_total) : null,
        new_user_only ? 1 : 0, finalRegionId
      ]
    );
    
    const [inserted] = await connection.query('SELECT * FROM vouchers WHERE id = ?', [newId]);
    connection.release();
    
    await logActivity(req, 'Membuat Voucher', `Membuat voucher baru: ${code.toUpperCase()} (${name})`);
    res.status(201).json(inserted[0]);
  } catch (error) {
    if (connection) connection.release();
    res.status(500).json({ error: error.message });
  }
});

// Update voucher
app.put('/api/vouchers/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Akses ditolak.' });
  }
  
  const { id } = req.params;
  const { code, name, discount_type, discount_value, min_order_amount, max_discount_amount, start_date, end_date, max_uses_total, new_user_only, is_active } = req.body;
  
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Check if voucher exists
    const [existing] = await connection.query('SELECT * FROM vouchers WHERE id = ?', [id]);
    if (existing.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Voucher tidak ditemukan.' });
    }
    
    // Branch admin cannot modify other regions' vouchers
    if (req.user.role?.toUpperCase() === 'ADMIN' && existing[0].region_id !== req.user.region_id) {
      connection.release();
      return res.status(403).json({ error: 'Akses ditolak untuk wilayah lain.' });
    }
    
    let updateFields = [];
    let updateValues = [];
    
    if (code !== undefined) {
      // Check if duplicate code exists in the same region
      const [dup] = await connection.query('SELECT id FROM vouchers WHERE code = ? AND region_id = ? AND id != ?', [code.toUpperCase().trim(), existing[0].region_id, id]);
      if (dup.length > 0) {
        connection.release();
        return res.status(400).json({ error: 'Kode voucher ini sudah digunakan di wilayah ini.' });
      }
      updateFields.push('code = ?');
      updateValues.push(code.toUpperCase().trim());
    }
    if (name !== undefined) { updateFields.push('name = ?'); updateValues.push(name.trim()); }
    if (discount_type !== undefined) { updateFields.push('discount_type = ?'); updateValues.push(discount_type); }
    if (discount_value !== undefined) { updateFields.push('discount_value = ?'); updateValues.push(Number(discount_value)); }
    if (min_order_amount !== undefined) { updateFields.push('min_order_amount = ?'); updateValues.push(Number(min_order_amount)); }
    if (max_discount_amount !== undefined) { updateFields.push('max_discount_amount = ?'); updateValues.push(max_discount_amount ? Number(max_discount_amount) : null); }
    if (start_date !== undefined) { updateFields.push('start_date = ?'); updateValues.push(start_date); }
    if (end_date !== undefined) { updateFields.push('end_date = ?'); updateValues.push(end_date); }
    if (max_uses_total !== undefined) { updateFields.push('max_uses_total = ?'); updateValues.push(max_uses_total ? Number(max_uses_total) : null); }
    if (new_user_only !== undefined) { updateFields.push('new_user_only = ?'); updateValues.push(new_user_only ? 1 : 0); }
    if (is_active !== undefined) { updateFields.push('is_active = ?'); updateValues.push(is_active ? 1 : 0); }
    
    if (updateFields.length > 0) {
      updateValues.push(id);
      await connection.query(`UPDATE vouchers SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
      await logActivity(req, 'Memperbarui Voucher', `Memperbarui voucher ID: ${id}`);
    }
    
    const [updated] = await connection.query('SELECT * FROM vouchers WHERE id = ?', [id]);
    connection.release();
    res.json(updated[0]);
  } catch (error) {
    if (connection) connection.release();
    res.status(500).json({ error: error.message });
  }
});

// Delete voucher
app.delete('/api/vouchers/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Akses ditolak.' });
  }
  
  const { id } = req.params;
  let connection;
  try {
    connection = await pool.getConnection();
    const [existing] = await connection.query('SELECT code, region_id FROM vouchers WHERE id = ?', [id]);
    if (existing.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Voucher tidak ditemukan.' });
    }
    
    if (req.user.role?.toUpperCase() === 'ADMIN' && existing[0].region_id !== req.user.region_id) {
      connection.release();
      return res.status(403).json({ error: 'Akses ditolak untuk wilayah lain.' });
    }
    
    await connection.query('DELETE FROM vouchers WHERE id = ?', [id]);
    connection.release();
    await logActivity(req, 'Menghapus Voucher', `Menghapus voucher: ${existing[0].code}`);
    res.json({ success: true, message: 'Voucher berhasil dihapus' });
  } catch (error) {
    if (connection) connection.release();
    res.status(500).json({ error: error.message });
  }
});

// Validate voucher
app.post('/api/vouchers/validate', verifyToken, async (req, res) => {
  const { code, region_id, userId, orderAmount } = req.body;
  
  if (!code || !region_id || !userId || orderAmount === undefined) {
    return res.status(400).json({ error: 'code, region_id, userId, and orderAmount are required.' });
  }
  
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Find active voucher matching code and region
    const [vouchers] = await connection.query(
      'SELECT * FROM vouchers WHERE code = ? AND region_id = ? AND is_active = 1',
      [code.toUpperCase().trim(), region_id]
    );
    
    if (vouchers.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'Voucher tidak valid atau tidak dapat digunakan di wilayah ini.' });
    }
    
    const voucher = vouchers[0];
    const now = new Date();
    
    // Check expiry dates
    if (now < new Date(voucher.start_date) || now > new Date(voucher.end_date)) {
      connection.release();
      return res.status(400).json({ error: 'Voucher sudah kadaluarsa atau belum dimulai.' });
    }
    
    // Check minimum order amount
    if (Number(orderAmount) < Number(voucher.min_order_amount)) {
      connection.release();
      return res.status(400).json({ error: `Minimal transaksi untuk voucher ini adalah Rp ${Number(voucher.min_order_amount).toLocaleString('id-ID')}.` });
    }
    
    // Check max usages total if configured
    if (voucher.max_uses_total !== null) {
      const [usageCount] = await connection.query('SELECT COUNT(*) as count FROM voucher_usages WHERE voucher_id = ?', [voucher.id]);
      if (usageCount[0].count >= voucher.max_uses_total) {
        connection.release();
        return res.status(400).json({ error: 'Kuota penggunaan voucher ini sudah habis.' });
      }
    }
    
    // Check if user has already used this voucher
    const [userUsage] = await connection.query('SELECT COUNT(*) as count FROM voucher_usages WHERE user_id = ? AND voucher_id = ?', [userId, voucher.id]);
    if (userUsage[0].count > 0) {
      connection.release();
      return res.status(400).json({ error: 'Anda sudah pernah menggunakan voucher ini.' });
    }
    
    // Check if new user only limit
    if (voucher.new_user_only) {
      const [orderCount] = await connection.query(
        "SELECT COUNT(*) as count FROM orders WHERE customerId = ? AND status != 'DIBATALKAN'",
        [userId]
      );
      if (orderCount[0].count > 0) {
        connection.release();
        return res.status(400).json({ error: 'Voucher ini hanya berlaku untuk pengguna baru.' });
      }
    }
    
    // Calculate discount amount
    let discount = 0;
    if (voucher.discount_type === 'fixed') {
      discount = Number(voucher.discount_value);
    } else { // percentage
      discount = Number(orderAmount) * (Number(voucher.discount_value) / 100);
      if (voucher.max_discount_amount !== null && discount > Number(voucher.max_discount_amount)) {
        discount = Number(voucher.max_discount_amount);
      }
      // Round discount to nearest Rp 100 as suggested
      discount = Math.round(discount / 100) * 100;
    }
    
    // Ensure discount doesn't exceed order amount
    if (discount > Number(orderAmount)) {
      discount = Number(orderAmount);
    }
    
    connection.release();
    res.json({
      valid: true,
      voucherId: voucher.id,
      code: voucher.code,
      name: voucher.name,
      discount_type: voucher.discount_type,
      discount_value: voucher.discount_value,
      min_order_amount: voucher.min_order_amount,
      computed_discount: discount
    });
  } catch (error) {
    if (connection) connection.release();
    res.status(500).json({ error: error.message });
  }
});

// =====================================================================
// PAYROLL SYSTEM API ENDPOINTS
// =====================================================================

// ---- STAFF GRADES CRUD ----

// GET all grades for a region
app.get('/api/staff-grades', verifyToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const user = req.user;
    let query = `
      SELECT sg.*, r.name as regionName
      FROM staff_grades sg
      LEFT JOIN regions r ON sg.region_id = r.id
    `;
    let params = [];
    if (user.role?.toLowerCase() === 'admin') {
      query += ' WHERE sg.region_id = ?';
      params.push(user.region_id);
    }
    query += ' ORDER BY sg.name ASC';
    const [grades] = await connection.query(query, params);
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

app.post('/api/staff-grades', verifyToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const user = req.user;
    const roleLower = user.role?.toLowerCase();
    if (roleLower !== 'keuangan' && roleLower !== 'owner') {
      return res.status(403).json({ error: 'Akses ditolak.' });
    }
    const { 
      name, description, region_id,
      leader_daily_base_salary = 0, leader_daily_travel_allowance = 0, leader_point_reward = 0,
      member_daily_base_salary = 0, member_daily_travel_allowance = 0, member_point_reward = 0,
      leader_monthly_base_salary = 0, leader_monthly_travel_allowance = 0,
      member_monthly_base_salary = 0, member_monthly_travel_allowance = 0
    } = req.body;
    let targetRegion = region_id || user.region_id;
    if (!targetRegion && (roleLower === 'owner' || roleLower === 'keuangan')) {
       const [regions] = await connection.query('SELECT id FROM regions LIMIT 1');
       if (regions.length > 0) targetRegion = regions[0].id;
    }
    if (!targetRegion) return res.status(400).json({ error: 'region_id diperlukan.' });

    const gradeId = `grade-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    await connection.query(
      `INSERT INTO staff_grades (
        id, region_id, name, description,
        leader_daily_base_salary, leader_daily_travel_allowance, leader_point_reward,
        member_daily_base_salary, member_daily_travel_allowance, member_point_reward,
        leader_monthly_base_salary, leader_monthly_travel_allowance,
        member_monthly_base_salary, member_monthly_travel_allowance
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        gradeId, targetRegion, name.trim(), description?.trim() || null,
        leader_daily_base_salary, leader_daily_travel_allowance, leader_point_reward,
        member_daily_base_salary, member_daily_travel_allowance, member_point_reward,
        leader_monthly_base_salary, leader_monthly_travel_allowance,
        member_monthly_base_salary, member_monthly_travel_allowance
      ]
    );

    await logActivity(req, 'Tambah Grade Karyawan', `Membuat grade baru: ${name} di wilayah ${targetRegion}`);
    res.json({ success: true, id: gradeId, message: `Grade "${name}" berhasil dibuat.` });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Nama grade sudah ada di wilayah ini.' });
    }
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// PUT update grade
app.put('/api/staff-grades/:id', verifyToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const user = req.user;
    const roleLower = user.role?.toLowerCase();
    if (roleLower !== 'keuangan' && roleLower !== 'owner') {
      return res.status(403).json({ error: 'Akses ditolak.' });
    }
    const { id } = req.params;
    const { 
      name, description,
      leader_daily_base_salary = 0, leader_daily_travel_allowance = 0, leader_point_reward = 0,
      member_daily_base_salary = 0, member_daily_travel_allowance = 0, member_point_reward = 0,
      leader_monthly_base_salary = 0, leader_monthly_travel_allowance = 0,
      member_monthly_base_salary = 0, member_monthly_travel_allowance = 0
    } = req.body;

    if (roleLower === 'admin') {
      const [check] = await connection.query('SELECT id FROM staff_grades WHERE id = ? AND region_id = ?', [id, user.region_id]);
      if (check.length === 0) return res.status(403).json({ error: 'Grade tidak ditemukan di wilayah Anda.' });
    }

    await connection.query(
      `UPDATE staff_grades SET 
        name = ?, description = ?,
        leader_daily_base_salary = ?, leader_daily_travel_allowance = ?, leader_point_reward = ?,
        member_daily_base_salary = ?, member_daily_travel_allowance = ?, member_point_reward = ?,
        leader_monthly_base_salary = ?, leader_monthly_travel_allowance = ?,
        member_monthly_base_salary = ?, member_monthly_travel_allowance = ?
       WHERE id = ?`,
      [
        name.trim(), description?.trim() || null,
        leader_daily_base_salary, leader_daily_travel_allowance, leader_point_reward,
        member_daily_base_salary, member_daily_travel_allowance, member_point_reward,
        leader_monthly_base_salary, leader_monthly_travel_allowance,
        member_monthly_base_salary, member_monthly_travel_allowance,
        id
      ]
    );

    await logActivity(req, 'Update Grade Karyawan', `Memperbarui grade ID: ${id}`);
    res.json({ success: true, message: 'Grade berhasil diperbarui.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// DELETE grade
app.delete('/api/staff-grades/:id', verifyToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const user = req.user;
    const roleLower = user.role?.toLowerCase();
    if (roleLower !== 'keuangan' && roleLower !== 'owner') {
      return res.status(403).json({ error: 'Akses ditolak.' });
    }
    const { id } = req.params;

    if (roleLower === 'admin') {
      const [check] = await connection.query('SELECT id FROM staff_grades WHERE id = ? AND region_id = ?', [id, user.region_id]);
      if (check.length === 0) return res.status(403).json({ error: 'Grade tidak ditemukan di wilayah Anda.' });
    }

    // Remove grade_id from users that use this grade
    await connection.query('UPDATE users SET grade_id = NULL WHERE grade_id = ?', [id]);
    await connection.query('DELETE FROM staff_grades WHERE id = ?', [id]);
    await logActivity(req, 'Hapus Grade Karyawan', `Menghapus grade ID: ${id}`);
    res.json({ success: true, message: 'Grade berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// PUT assign grade to a user
app.put('/api/users/:id/grade', verifyToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const user = req.user;
    const roleLower = user.role?.toLowerCase();
    if (roleLower !== 'keuangan' && roleLower !== 'owner') {
      return res.status(403).json({ error: 'Akses ditolak.' });
    }

    const { grade_id } = req.body;
    const { id } = req.params;

    await connection.query('UPDATE users SET grade_id = ? WHERE id = ?', [grade_id || null, id]);
    res.json({ success: true, message: 'Grade berhasil diupdate untuk user ini.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// PUT assign team
app.put('/api/staff/assign-team', verifyToken, async (req, res) => {
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
      await connection.query(`UPDATE users SET grade_id = ?, is_leader = 0, leader_id = ? WHERE id IN (${placeholders})`, [grade_id, leader_id, ...member_ids]);
    }
    
    await connection.commit();
    res.json({ success: true, message: 'Tim berhasil ditugaskan.' });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// GET staff list with grades for payroll page
app.get('/api/salary/staff', verifyToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const user = req.user;
    let query = `
      SELECT u.id, u.name, u.email, u.phone, u.region_id, u.grade_id, u.is_leader, u.leader_id,
             u.salary_balance, u.points_balance, u.salary_type, u.monthly_salary_date, u.last_monthly_salary_paid,
             sg.name as grade_name,
             sg.leader_daily_base_salary, sg.leader_daily_travel_allowance, sg.leader_point_reward,
             sg.member_daily_base_salary, sg.member_daily_travel_allowance, sg.member_point_reward,
             r.name as regionName,
             leader.name as leader_name
      FROM users u
      LEFT JOIN staff_grades sg ON u.grade_id = sg.id
      LEFT JOIN regions r ON u.region_id = r.id
      LEFT JOIN users leader ON u.leader_id = leader.id
      WHERE u.role = 'karyawan'
    `;
    const params = [];
    if (user.role?.toLowerCase() === 'admin') {
      query += ' AND u.region_id = ?';
      params.push(user.region_id);
    }
    query += ' ORDER BY u.name ASC';
    const [staff] = await connection.query(query, params);
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});


// ==========================================
// NEW: HIERARCHY, CLAIMS, & POINTS ENDPOINTS
// ==========================================

// 1. Assign Team Leader
app.put('/api/users/:id/leader', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { leader_id } = req.body;
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.query('UPDATE users SET leader_id = ? WHERE id = ?', [leader_id || null, req.params.id]);
    res.json({ message: 'Leader updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// 2. Get My Team (For Team Leader)
app.get('/api/staff/team', verifyToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [team] = await connection.query('SELECT id, name, email, phone, photo, points_balance, grade_id FROM users WHERE leader_id = ? AND role = "karyawan"', [req.user.id]);
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// 3. Get Staff Dashboard Data (My Salary & Points)
app.get('/api/staff/my-salary', verifyToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const userId = req.user.id;
    const now = new Date();
    const localDate = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const currentMonthStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}`;
    
    const [users] = await connection.query(`
      SELECT u.id, u.name, u.is_leader, u.points_balance, u.salary_balance, sg.leader_daily_base_salary, sg.leader_daily_travel_allowance, sg.leader_point_reward,
             sg.member_daily_base_salary, sg.member_daily_travel_allowance, sg.member_point_reward
      FROM users u
      LEFT JOIN staff_grades sg ON u.grade_id = sg.id
      WHERE u.id = ?
    `, [userId]);

    if (users.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
    const user = users[0];

    const [orders] = await connection.query(`
      SELECT o.id, o.completedAt as completed_at, o.acDetail
      FROM orders o
      WHERE o.workerId = ?
        AND o.status = 'SELESAI'
        AND o.completedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `, [userId]);

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

    const [claims] = await connection.query('SELECT * FROM claims WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [userId]);
    const [monthlySalaries] = await connection.query('SELECT * FROM monthly_salary_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [userId]);

    const history = [];

    claims.forEach(c => {
      let hType = 'klaim_gaji';
      let hTitle = 'Pencairan Saldo Gaji';
      let hAmount = -c.amount;
      
      if (c.type === 'points') {
        hType = 'klaim_poin';
        hTitle = 'Penukaran Poin Bonus';
        hAmount = -c.points_claimed;
      } else if (c.type === 'gaji_bulanan') {
        hType = 'tambah_gaji_bulanan';
        hTitle = 'Gaji Pokok & Uang Jalan Bulanan';
        hAmount = c.amount; // POSITIVE amount!
      }
      
      history.push({
        id: `claim-${c.id}`,
        date: c.created_at,
        type: hType,
        title: hTitle,
        amount: hAmount,
        status: c.status,
        notes: c.notes || (c.type === 'gaji_bulanan' ? 'Penerimaan otomatis' : 'Pengajuan klaim')
      });
    });

    monthlySalaries.forEach(ms => {
      history.push({
        id: `ms-${ms.id}`,
        date: ms.created_at,
        type: 'tambah_gaji_bulanan',
        title: 'Gaji Pokok & Uang Jalan Bulanan',
        amount: Number(ms.amount),
        status: 'approved',
        notes: ms.notes || 'Penerimaan otomatis'
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
          id: `salary-${firstOrder.id}`,
          date: firstOrder.completed_at,
          type: 'tambah_gaji',
          title: 'Gaji Pokok & Uang Jalan (Harian)',
          amount: dailyBase + dailyTravel,
          status: 'approved',
          notes: `Penyelesaian Order #${firstOrder.id}`
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
            id: `points-${o.id}`,
            date: o.completed_at,
            type: 'tambah_poin',
            title: 'Bonus Poin Performa',
            amount: acCount * pointReward,
            status: 'approved',
            notes: `Penyelesaian Order #${o.id} (${acCount} Unit AC)`
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
});

// GET my team performance
app.get('/api/staff/team', verifyToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const userId = req.user.id;
    const now = new Date();
    const localDate = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const currentMonthStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}`;

    const [leaderCheck] = await connection.query('SELECT is_leader FROM users WHERE id = ?', [userId]);
    if (!leaderCheck.length || !leaderCheck[0].is_leader) {
      return res.status(403).json({ error: 'Bukan team leader.' });
    }

    const [members] = await connection.query(`
      SELECT u.id, u.name, u.phone, u.status, sg.member_point_reward, u.points_balance
      FROM users u
      LEFT JOIN staff_grades sg ON u.grade_id = sg.id
      WHERE u.leader_id = ?
    `, [userId]);

    for (let member of members) {
      const [orders] = await connection.query(`
        SELECT o.id, o.completedAt as completed_at, o.acDetail, o.rating
        FROM orders o
        WHERE o.workerId = ?
          AND o.status = 'SELESAI'
          AND DATE_FORMAT(o.completedAt, '%Y-%m') = ?
      `, [member.id, currentMonthStr]);

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

// 4. Request Claim
app.post('/api/claims', verifyToken, async (req, res) => {
  const { type, amount, points_claimed, notes } = req.body;
  if (!['daily_salary', 'points'].includes(type)) {
    return res.status(400).json({ error: 'Invalid claim type' });
  }
  let connection;
  try {
    connection = await pool.getConnection();
    if (type === 'points') {
      const [users] = await connection.query('SELECT points_balance FROM users WHERE id = ?', [req.user.id]);
      const [pendingClaims] = await connection.query('SELECT SUM(points_claimed) as pending FROM claims WHERE user_id = ? AND status = "pending" AND type = "points"', [req.user.id]);
      const pending = Number(pendingClaims[0]?.pending) || 0;
      const bal = users[0]?.points_balance || 0;
      if (bal - pending < points_claimed) {
        return res.status(400).json({ error: 'Points balance insufficient (Check pending claims)' });
      }
    } else if (type === 'daily_salary') {
      const [users] = await connection.query('SELECT salary_balance FROM users WHERE id = ?', [req.user.id]);
      const [pendingClaims] = await connection.query('SELECT SUM(amount) as pending FROM claims WHERE user_id = ? AND status = "pending" AND type = "daily_salary"', [req.user.id]);
      const pending = Number(pendingClaims[0]?.pending) || 0;
      const bal = users[0]?.salary_balance || 0;
      if (bal - pending < amount) {
        return res.status(400).json({ error: 'Salary balance insufficient (Check pending claims)' });
      }
    }
    await connection.query(
      'INSERT INTO claims (user_id, type, amount, points_claimed, status, notes) VALUES (?, ?, ?, ?, "pending", ?)',
      [req.user.id, type, amount || 0, points_claimed || 0, notes || '']
    );
    res.json({ message: 'Claim requested successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// 5. Get All Claims
app.get('/api/claims', verifyToken, async (req, res) => {
  if (req.user.role !== 'keuangan' && req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Access denied' });
  }
  let connection;
  try {
    connection = await pool.getConnection();
    const [claims] = await connection.query(`
      SELECT c.*, u.name as user_name, u.role as user_role 
      FROM claims c 
      JOIN users u ON c.user_id = u.id 
      ORDER BY c.created_at DESC
    `);
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// 6. Approve / Reject Claim
app.put('/api/claims/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'keuangan' && req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { status } = req.body;
  let connection;
  try {
    connection = await pool.getConnection();
    const [claimRows] = await connection.query('SELECT * FROM claims WHERE id = ?', [req.params.id]);
    if (claimRows.length === 0) return res.status(404).json({ error: 'Claim not found' });
    const claim = claimRows[0];
    
    if (claim.status !== 'pending') return res.status(400).json({ error: 'Claim already processed' });
    
    if (status === 'approved' && claim.type === 'points') {
      await connection.query('UPDATE users SET points_balance = points_balance - ? WHERE id = ?', [claim.points_claimed, claim.user_id]);
    } else if (status === 'approved' && claim.type === 'daily_salary') {
      await connection.query('UPDATE users SET salary_balance = salary_balance - ? WHERE id = ?', [claim.amount, claim.user_id]);
    }
    
    await connection.query('UPDATE claims SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Claim updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

  app.put('/api/users/:id/salary-settings', verifyToken, async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      const user = req.user;
      const roleLower = user.role?.toLowerCase();
      if (roleLower !== 'admin' && roleLower !== 'owner' && roleLower !== 'keuangan') {
        return res.status(403).json({ error: 'Akses ditolak.' });
      }
      const { id } = req.params;
      const { salary_type, monthly_salary_date } = req.body;
      
      await connection.query(
        'UPDATE users SET salary_type = ?, monthly_salary_date = ? WHERE id = ?',
        [salary_type || 'daily', monthly_salary_date || null, id]
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    } finally {
      if (connection) connection.release();
    }
  });

  app.post('/api/salary/process-monthly', verifyToken, async (req, res) => {
    try {
      const processedCount = await processMonthlySalaries();
      res.json({ success: true, processedCount });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Background job to process monthly salaries automatically
  const processMonthlySalaries = async () => {
    let connection;
    let processedCount = 0;
    try {
      connection = await pool.getConnection();
      const today = new Date();
      // Adjust to UTC+7
      const localDate = new Date(today.getTime() + 7 * 60 * 60 * 1000);
      const dateNum = localDate.getDate();
      const currentMonthStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      
      const [eligibleUsers] = await connection.query(`
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
          // Add to balance and update last paid
          await connection.query(
            'UPDATE users SET salary_balance = salary_balance + ?, last_monthly_salary_paid = ? WHERE id = ?',
            [total, localDate, st.id]
          );
          
          // Insert into monthly_salary_history
          await connection.query(
            'INSERT INTO monthly_salary_history (user_id, amount, notes, created_at) VALUES (?, ?, ?, ?)',
            [st.id, total, `Gaji Pokok & Uang Jalan Bulanan (${currentMonthStr})`, localDate]
          );
          
          processedCount++;
        }
      }
    } catch (error) {
      console.error('Error processing monthly salaries:', error);
    } finally {
      if (connection) connection.release();
    }
    return processedCount;
  };

  // Run the background job every hour automatically
  setInterval(() => {
    processMonthlySalaries();
  }, 60 * 60 * 1000);

nextApp.prepare().then(() => {
  // Semua request selain /api akan diserahkan ke Next.js
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server (API + Next.js) running on http://localhost:${PORT}`);
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
}).catch((err) => {
  console.error('Error starting Next.js:', err);
  process.exit(1);
});
