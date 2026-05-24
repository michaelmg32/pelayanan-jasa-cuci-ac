-- Create Database
CREATE DATABASE IF NOT EXISTS pelayanan_cuci_ac;
USE pelayanan_cuci_ac;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  role ENUM('pelanggan', 'karyawan', 'admin', 'owner') NOT NULL,
  password VARCHAR(255) NOT NULL,
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
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AC Services Table
CREATE TABLE IF NOT EXISTS ac_services (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  basePrice DECIMAL(10, 2) NOT NULL,
  duration INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AC Addons Table
CREATE TABLE IF NOT EXISTS ac_addons (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  customerId VARCHAR(50) NOT NULL,
  workerId VARCHAR(50),
  status ENUM('pending', 'assigned', 'in_progress', 'completed', 'cancelled') NOT NULL,
  schedule DATETIME NOT NULL,
  serviceIds JSON,
  addonIds JSON,
  notes TEXT,
  totalPrice DECIMAL(10, 2),
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
('user-1', 'Budi Santoso', 'budi@example.com', '0812345678', 'pelanggan', 'password123'),
('user-2', 'Ahmad Riyanto', 'ahmad@example.com', '0812345679', 'karyawan', 'password123'),
('user-3', 'Admin User', 'admin@example.com', '0812345680', 'admin', 'password123'),
('user-4', 'Owner Business', 'owner@example.com', '0812345681', 'owner', 'password123');

INSERT INTO ac_models (id, name, manufacturer) VALUES
('model-1', 'Window Unit 1.5PK', 'Panasonic'),
('model-2', 'Window Unit 2PK', 'LG'),
('model-3', 'Split Unit 1.5PK', 'Daikin');

INSERT INTO ac_services (id, name, description, basePrice, duration) VALUES
('svc-1', 'Pembersihan AC', 'Pembersihan menyeluruh AC', 150000, 60),
('svc-2', 'Penggantian Filter', 'Ganti filter udara AC', 100000, 30),
('svc-3', 'Service Rutin', 'Service rutin bulanan', 200000, 90);

INSERT INTO ac_addons (id, name, description, price) VALUES
('addon-1', 'Desinfektan', 'Disinfektasi khusus AC', 50000),
('addon-2', 'Refill Freon', 'Penambahan freon AC', 300000);
