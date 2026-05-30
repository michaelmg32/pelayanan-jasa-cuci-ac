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
  hasServices BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AC Services Table
CREATE TABLE IF NOT EXISTS ac_services (
  id VARCHAR(50) PRIMARY KEY,
  categoryId VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  basePrice DECIMAL(10, 2) NOT NULL,
  price DECIMAL(10, 2),
  duration INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoryId) REFERENCES ac_categories(id),
  INDEX idx_categoryId (categoryId)
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

INSERT INTO ac_services (id, categoryId, name, description, basePrice, price, duration) VALUES
('svc-1', 'cat-1', 'Cuci AC Rutin', 'Pembersihan menyeluruh AC', 150000, 150000, 60),
('svc-2', 'cat-1', 'Cuci AC Overhaul', 'Pembersihan lengkap dengan penggantian spare', 250000, 250000, 120),
('svc-3', 'cat-2', 'Perbaikan Kompresor', 'Perbaikan kompresor AC', 500000, 500000, 180),
('svc-4', 'cat-3', 'Service Bulanan', 'Service rutin bulanan', 100000, 100000, 45);

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
