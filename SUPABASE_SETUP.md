# Supabase Database Setup Guide

This guide will help you set up your Supabase database for the Vintner & Spirit application.

## Prerequisites

1. Create a free account at [Supabase](https://supabase.com)
2. Create a new project

## Step 1: Get Your Supabase Credentials

1. Go to your project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (e.g., `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

4. Create a `.env` file in the root directory (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

5. Update the `.env` file with your credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

## Step 2: Create Database Tables

Run the following SQL in your Supabase **SQL Editor**:

### Products Table
```sql
CREATE TABLE products (
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

-- Create indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
```

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  phone VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_users_phone ON users(phone);
```

### Customers Table
```sql
CREATE TABLE customers (
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

-- Create indexes
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
```

### Orders Table
```sql
CREATE TABLE orders (
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

-- Create indexes
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(date);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
```

### Discount Codes Table
```sql
CREATE TABLE discount_codes (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'percentage' or 'fixed'
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

-- Create indexes
CREATE INDEX idx_discount_codes_code ON discount_codes(code);
CREATE INDEX idx_discount_codes_active ON discount_codes(is_active);
```

### Settings Table
```sql
CREATE TABLE settings (
  id INT PRIMARY KEY DEFAULT 1,
  paypack_api_key VARCHAR(255),
  paypack_api_secret VARCHAR(255),
  store_name VARCHAR(255) DEFAULT 'Vintner & Spirit',
  is_maintenance_mode BOOLEAN DEFAULT FALSE,
  email_notifications BOOLEAN DEFAULT TRUE,
  admin_password VARCHAR(255) DEFAULT 'admin123',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings row
INSERT INTO settings (id, paypack_api_key, paypack_api_secret, store_name, is_maintenance_mode, email_notifications, admin_password)
VALUES (1, '', '', 'Vintner & Spirit', FALSE, TRUE, 'admin123')
ON CONFLICT (id) DO NOTHING;
```

## Step 3: Set Up Row Level Security (RLS)

For this application, we'll disable RLS for simplicity since authentication is handled by the server. However, for production apps, you should enable RLS and create appropriate policies.

```sql
-- Disable RLS for all tables (for development only!)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
```

**⚠️ Security Warning:** Disabling RLS means anyone with your anon key can access your data. For production:
1. Enable RLS on all tables
2. Create policies for authenticated users
3. Consider using Supabase Auth

## Step 4: Test Your Connection

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Check the console for:
   ```
   ✅ Supabase connected successfully
   ✅ Database ready!
   Server running on http://localhost:3000
   ```

## Step 5: Seed Sample Data (Optional)

You can add sample products through the Admin Dashboard or use the SQL Editor:

```sql
INSERT INTO products (id, name, description, price, category, image, origin, abv, year, stock, min_stock_level) VALUES
('prod1', 'Sample Wine', 'A delicious red wine', 25000, 'Wine', 'data:image/svg+xml,...', 'France', '13.5%', 2020, 100, 10),
('prod2', 'Premium Whiskey', 'Aged 12 years', 45000, 'Liquor', 'data:image/svg+xml,...', 'Scotland', '40%', 2012, 50, 5);
```

## Troubleshooting

### Connection Issues
- Verify your Supabase URL and anon key in `.env`
- Ensure tables are created in Supabase
- Check browser console for errors

### Permission Errors
- Make sure RLS is disabled (for development)
- Verify your anon key has correct permissions

### Data Not Loading
- Check browser network tab for failed API calls
- Verify table names match exactly (case-sensitive)
- Ensure all required columns exist

## Migration from MySQL

If you're migrating from MySQL:

1. Export your MySQL data:
   ```bash
   mysqldump -u root -p vintner_spirit> backup.sql
   ```

2. Convert the SQL to Supabase PostgreSQL format

3. Import into Supabase SQL Editor

4. Verify data integrity

## Next Steps

- Set up Supabase Auth for better security
- Enable RLS with appropriate policies
- Configure automated backups
- Set up database webhooks for real-time updates
- Monitor database usage in Supabase dashboard

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase PostgreSQL Differences](https://supabase.com/docs/guides/database/postgres/differences-from-postgres)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Need Help?** Check the Supabase Discord community or contact support.
