-- Create Database
CREATE DATABASE IF NOT EXISTS pelayanan_cuci_ac;
USE pelayanan_cuci_ac;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  lat DOUBLE,
  lng DOUBLE,
  role ENUM('pelanggan', 'karyawan', 'admin', 'owner') NOT NULL,
  password VARCHAR(255) NOT NULL,
  photo LONGTEXT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_email (email)
);

-- AC Models Table
CREATE TABLE IF NOT EXISTS ac_models (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  manufacturer VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AC Categories Table
CREATE TABLE IF NOT EXISTS ac_categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon LONGTEXT NULL,
  hasServices BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AC Services Table
CREATE TABLE IF NOT EXISTS ac_services (
  id VARCHAR(50) PRIMARY KEY,
  categoryId VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoryId) REFERENCES ac_categories(id),
  INDEX idx_categoryId (categoryId)
);

-- AC Service Prices Table (Pivot)
CREATE TABLE IF NOT EXISTS ac_service_prices (
  id VARCHAR(50) PRIMARY KEY,
  serviceId VARCHAR(50) NOT NULL,
  modelId VARCHAR(50) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (serviceId) REFERENCES ac_services(id) ON DELETE CASCADE,
  FOREIGN KEY (modelId) REFERENCES ac_models(id) ON DELETE CASCADE,
  UNIQUE INDEX idx_service_model (serviceId, modelId)
);

-- AC Addons Table
CREATE TABLE IF NOT EXISTS ac_addons (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  hpp DECIMAL(10, 2) DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  customerId VARCHAR(50) NOT NULL,
  customerName VARCHAR(255),
  customerPhone VARCHAR(20),
  address TEXT,
  workerId VARCHAR(50),
  assignedEmployeeName VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  schedule DATETIME,
  scheduledDate VARCHAR(50),
  scheduledTime VARCHAR(50),
  serviceIds JSON,
  addonIds JSON,
  acDetail JSON,
  notes TEXT,
  serviceCost DECIMAL(10, 2) DEFAULT 0,
  addonsCost DECIMAL(10, 2) DEFAULT 0,
  margin DECIMAL(10, 2) DEFAULT 0,
  quantity INT DEFAULT 1,
  hpp_orders DECIMAL(10, 2) DEFAULT 0,
  finalPrice DECIMAL(10, 2) DEFAULT 0,
  totalPrice DECIMAL(10, 2),
  totalCost DECIMAL(10, 2),
  photoBefore LONGTEXT,
  photoAfter LONGTEXT,
  addonsUsed JSON,
  paymentMethod VARCHAR(20),
  paymentStatus VARCHAR(50),
  rating INT,
  ratingNotes TEXT,
  latitude DOUBLE,
  longitude DOUBLE,
  paymentUrl VARCHAR(255),
  paymentInvoiceId VARCHAR(255),
  completedAt TIMESTAMP NULL,
  completionNotes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customerId) REFERENCES users(id),
  FOREIGN KEY (workerId) REFERENCES users(id),
  INDEX idx_status (status),
  INDEX idx_customerId (customerId),
  INDEX idx_workerId (workerId)
);

-- Insert Sample Data
INSERT INTO users (id, name, email, phone, role, password) VALUES
('user-1', 'Budi Santoso', 'budi@example.com', '0812345678', 'pelanggan', '$2b$10$IyJaHTB1.yDO9P07X1GcRuWPSvYDmBH.SJbxzS0IuAV/WttH6uSY6'),
('user-2', 'Ahmad Riyanto', 'ahmad@example.com', '0812345679', 'karyawan', '$2b$10$IyJaHTB1.yDO9P07X1GcRuWPSvYDmBH.SJbxzS0IuAV/WttH6uSY6'),
('user-3', 'Admin User', 'admin@example.com', '0812345680', 'admin', '$2b$10$IyJaHTB1.yDO9P07X1GcRuWPSvYDmBH.SJbxzS0IuAV/WttH6uSY6'),
('user-4', 'Owner Business', 'owner@example.com', '0812345681', 'owner', '$2b$10$IyJaHTB1.yDO9P07X1GcRuWPSvYDmBH.SJbxzS0IuAV/WttH6uSY6');

INSERT INTO ac_categories (id, name, description, hasServices) VALUES
('cat-1', 'Pembersihan AC', 'Layanan pembersihan dan perawatan AC', true),
('cat-2', 'Perbaikan AC', 'Layanan perbaikan AC yang rusak', true),
('cat-3', 'Perawatan Rutin', 'Layanan perawatan berkala AC', true);

INSERT INTO ac_models (id, name, manufacturer) VALUES
('model-1', 'Window Unit 1.5PK', 'Panasonic'),
('model-2', 'Window Unit 2PK', 'LG'),
('model-3', 'Split Unit 1.5PK', 'Daikin');

INSERT INTO ac_services (id, categoryId, name, description, duration) VALUES
('svc-1', 'cat-1', 'Cuci AC Rutin', 'Pembersihan menyeluruh AC', 60),
('svc-2', 'cat-1', 'Cuci AC Overhaul', 'Pembersihan lengkap dengan penggantian spare', 120),
('svc-3', 'cat-2', 'Perbaikan Kompresor', 'Perbaikan kompresor AC', 180),
('svc-4', 'cat-3', 'Service Bulanan', 'Service rutin bulanan', 45);

INSERT INTO ac_service_prices (id, serviceId, modelId, price) VALUES
('price-1', 'svc-1', 'model-1', 150000),
('price-2', 'svc-1', 'model-2', 150000),
('price-3', 'svc-1', 'model-3', 150000),
('price-4', 'svc-2', 'model-1', 250000),
('price-5', 'svc-2', 'model-2', 250000),
('price-6', 'svc-2', 'model-3', 250000),
('price-7', 'svc-3', 'model-1', 500000),
('price-8', 'svc-3', 'model-2', 500000),
('price-9', 'svc-3', 'model-3', 500000),
('price-10', 'svc-4', 'model-1', 100000),
('price-11', 'svc-4', 'model-2', 100000),
('price-12', 'svc-4', 'model-3', 100000);

INSERT INTO ac_addons (id, name, description, price, hpp) VALUES
('addon-1', 'Desinfektan', 'Disinfektasi khusus AC', 50000, 20000),
('addon-2', 'Refill Freon', 'Penambahan freon AC', 300000, 150000),
('addon-3', 'Pembersihan Indoor Coil', 'Pembersihan coil indoor khusus', 75000, 30000),
('addon-4', 'Penggantian Filter', 'Ganti filter udara AC baru', 100000, 45000);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
  key_name VARCHAR(50) PRIMARY KEY,
  value LONGTEXT
);

INSERT INTO settings (key_name, value) VALUES 
('business_name', 'CoolAir Pro'),
('business_logo', '')
ON DUPLICATE KEY UPDATE key_name=key_name;

-- AC Addon Transactions Table
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
);

-- Master Data AC Pelanggan
CREATE TABLE IF NOT EXISTS customer_ac (
  id VARCHAR(50) PRIMARY KEY,
  customerId VARCHAR(50) NOT NULL,
  acModelId VARCHAR(50) NULL,
  brand VARCHAR(100) NULL,
  name VARCHAR(255) NULL,
  locationNotes TEXT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customerId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (acModelId) REFERENCES ac_models(id) ON DELETE SET NULL
);

-- Riwayat Servis AC (Before/After & Catatan per AC)
CREATE TABLE IF NOT EXISTS order_ac_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderId VARCHAR(50) NOT NULL,
  customerAcId VARCHAR(50) NOT NULL,
  serviceName VARCHAR(255) NOT NULL,
  photoBefore LONGTEXT NULL,
  photoAfter LONGTEXT NULL,
  notes TEXT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (customerAcId) REFERENCES customer_ac(id) ON DELETE CASCADE
);

