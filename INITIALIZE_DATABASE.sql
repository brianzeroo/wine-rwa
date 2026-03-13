-- ==========================================
-- 1. CREATE TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  image TEXT,
  origin VARCHAR(255),
  abv VARCHAR(10),
  year INT,
  stock INT DEFAULT 0,
  min_stock_level INT DEFAULT 0,
  tags JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  phone VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50),
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255) NOT NULL,
  items JSONB NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  final_total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending',
  payment_method VARCHAR(50),
  shipping_address TEXT,
  notes TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discount_codes (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  usage_limit INT DEFAULT 0,
  used_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY DEFAULT 1,
  paypack_api_key VARCHAR(255),
  paypack_api_secret VARCHAR(255),
  store_name VARCHAR(255) DEFAULT 'Vintner & Spirit',
  is_maintenance_mode BOOLEAN DEFAULT FALSE,
  email_notifications BOOLEAN DEFAULT TRUE,
  admin_password VARCHAR(255) DEFAULT 'admin123',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. INITIALIZE DATA
-- ==========================================

INSERT INTO settings (id, store_name, admin_password, is_maintenance_mode, email_notifications)
VALUES (1, 'Vintner & Spirit', 'admin123', FALSE, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, name, description, price, category, image, origin, abv, year, stock, min_stock_level, tags)
VALUES 
('prod1', 'Chateau Margaux 2015', 'A legendary Bordeaux with exceptional depth and elegance.', 850000, 'Wine', 'https://images.unsplash.com/photo-1510850402280-d23a7f0c1cae?auto=format&fit=crop&q=80', 'France', '13.5%', 2015, 12, 2, '["Red", "Bordeaux", "Boutique"]'),
('prod2', 'Macallan 18Y Sherry Oak', 'Rich, dried fruit and ginger spice with a long, silky finish.', 450000, 'Liquor', 'https://images.unsplash.com/photo-1527281032558-6d3f230bc617?auto=format&fit=crop&q=80', 'Scotland', '43%', 2005, 8, 1, '["Whisky", "Sherry Oak", "Premium"]'),
('prod3', 'Veuve Clicquot Yellow Label', 'The signature champagne of the house, vibrant and structured.', 75000, 'Wine', 'https://images.unsplash.com/photo-1594498653385-d5172c532c00?auto=format&fit=crop&q=80', 'France', '12.5%', 0, 24, 6, '["Champagne", "Sparkling", "Celebration"]'),
('prod4', 'Mouton Cadet Heritage', 'A classic blend representing the spirit of Bordeaux.', 25000, 'Wine', 'https://images.unsplash.com/photo-1553361371-9bb223b33f3a?auto=format&fit=crop&q=80', 'France', '13%', 2021, 48, 12, '["Red", "Bordeaux", "Everyday"]'),
('prod5', 'Hendrick''s Gin', 'Divinely infused with cucumber and rose petals.', 35000, 'Liquor', 'https://images.unsplash.com/photo-1607622488478-430932296765?auto=format&fit=crop&q=80', 'UK', '41.4%', 0, 15, 4, '["Gin", "Infused", "Botanical"]');

-- ==========================================
-- 3. DISABLE RLS (Development Mode Only)
-- ==========================================

ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
