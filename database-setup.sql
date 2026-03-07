-- MySQL Database Setup Script for Vintner & Spirit
-- Run this script to create the database and tables manually if needed

-- Create database
CREATE DATABASE IF NOT EXISTS vintner_spirit 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE vintner_spirit;

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  image TEXT, -- Product image URL or base64 encoded image (TEXT to support base64)
  origin VARCHAR(255),
  abv VARCHAR(10),
  year INT,
  stock INT DEFAULT 0,
  min_stock_level INT DEFAULT 0,
  tags JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  join_date DATE,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  order_count INT DEFAULT 0,
  loyalty_points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50),
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255) NOT NULL,
  items JSON NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  final_total DECIMAL(10, 2) NOT NULL,
  status ENUM('Pending', 'Processing', 'Shipped', 'Delivered', 'Completed', 'Cancelled') DEFAULT 'Pending',
  payment_method VARCHAR(50),
  shipping_address TEXT,
  notes TEXT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  INDEX idx_customer_email (customer_email),
  INDEX idx_status (status),
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Discount Codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  type ENUM('percentage', 'fixed') NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  usage_limit INT DEFAULT 0,
  used_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  paypack_api_key VARCHAR(255),
  paypack_api_secret VARCHAR(255),
  store_name VARCHAR(255) DEFAULT 'Vintner & Spirit',
  is_maintenance_mode BOOLEAN DEFAULT FALSE,
  email_notifications BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT INTO settings (paypack_api_key, paypack_api_secret, store_name, is_maintenance_mode, email_notifications)
VALUES ('', '', 'Vintner & Spirit', FALSE, TRUE)
ON DUPLICATE KEY UPDATE store_name = VALUES(store_name);

-- Insert sample data for testing (optional)
-- Uncomment these lines if you want to populate initial data

/*
INSERT INTO products (id, name, description, price, category, image, origin, abv, year, stock, min_stock_level, tags) VALUES
('w1', 'Château Margaux 2015', 'A legendary vintage from one of the most prestigious estates in Bordeaux.', 1600000, 'Wine', 'https://images.unsplash.com/photo-15108504777530-ce990e85c55e?auto=format&fit=crop&q=80&w=800', 'Bordeaux, France', '13.5%', 2015, 10, 3, '["premium", "red-wine", "bordeaux"]'),
('w2', 'Dom Pérignon Vintage 2012', 'The 2012 vintage is a powerhouse of energy and precision.', 350000, 'Wine', 'https://images.unsplash.com/photo-1594498653385-d5172c532c00?auto=format&fit=crop&q=80&w=800', 'Champagne, France', '12.5%', 2012, 20, 5, '["champagne", "sparkling", "vintage"]');

INSERT INTO users (id, email, password, name) VALUES
('user1', 'test@example.com', 'password123', 'Test User');

INSERT INTO discount_codes (id, code, type, value, min_order_amount, start_date, end_date, is_active, usage_limit, used_count) VALUES
('disc1', 'WELCOME10', 'percentage', 10, 100000, '2024-01-01', '2025-12-31', TRUE, 100, 0),
('disc2', 'SAVE20000', 'fixed', 20000, 200000, '2024-01-01', '2025-12-31', TRUE, 50, 0);
*/