import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vintner_spirit',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Configuration without database for initial connection
const dbConfigNoDb = {
  ...dbConfig,
  database: undefined
};

// Create connection pool
let pool: mysql.Pool | null = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// Get a connection pool without specifying database
function getPoolNoDb() {
  return mysql.createPool(dbConfigNoDb);
}

export async function testConnection() {
  try {
    // First, try to connect without database to check MySQL connection
    const poolNoDb = getPoolNoDb();
    const connection = await poolNoDb.getConnection();
    console.log('✅ MySQL server connected successfully');
    connection.release();

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${dbConfig.database}' created or already exists`);

    // Now test connection with the actual database
    const dbConnection = await getPool().getConnection();
    console.log('✅ MySQL database connected successfully');
    dbConnection.release();

    // Close the no-db pool
    await poolNoDb.end();

    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error);
    return false;
  }
}

// Initialize database schema
export async function initializeDatabase() {
  const connection = await getPool().getConnection();

  try {
    // Create Products table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        image LONGTEXT,
        origin VARCHAR(255),
        abv VARCHAR(10),
        year INT,
        stock INT DEFAULT 0,
        min_stock_level INT DEFAULT 0,
        tags JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        phone VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_phone (phone)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create Customers table
    await connection.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create Orders table
    await connection.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create Discount Codes table
    await connection.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create Settings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        paypack_api_key VARCHAR(255),
        paypack_api_secret VARCHAR(255),
        store_name VARCHAR(255) DEFAULT 'Vintner & Spirit',
        is_maintenance_mode BOOLEAN DEFAULT FALSE,
        email_notifications BOOLEAN DEFAULT TRUE,
        admin_password VARCHAR(255) DEFAULT 'admin123',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Insert default settings if not exists
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM settings');
    if ((rows as any)[0].count === 0) {
      await connection.query(`
        INSERT INTO settings (paypack_api_key, paypack_api_secret, store_name, is_maintenance_mode, email_notifications, admin_password)
        VALUES ('', '', 'Vintner & Spirit', FALSE, TRUE, 'admin123')
      `);
    }

    // Migration: drop customer_id FK on orders to allow guest checkout
    try {
      // Find and drop the FK constraint if it exists
      const [fkRows] = await connection.query(`
        SELECT CONSTRAINT_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'orders'
          AND COLUMN_NAME = 'customer_id'
          AND REFERENCED_TABLE_NAME = 'customers'
      `);
      for (const fk of fkRows as any[]) {
        await connection.query(`ALTER TABLE orders DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
        console.log(`✅ Dropped FK constraint: ${fk.CONSTRAINT_NAME}`);
      }
    } catch (e: any) {
      console.log(`ℹ️ FK migration note: ${e.message}`);
    }

    // Migration for image column
    try {
      await connection.query('ALTER TABLE products MODIFY COLUMN image LONGTEXT');
      console.log('✅ Updated products.image to LONGTEXT');
    } catch (e) {
      console.log('ℹ️ products.image already updated or table doesn\'t exist yet');
    }

    // Migration for admin_password column
    try {
      await connection.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS admin_password VARCHAR(255) DEFAULT "admin123" AFTER email_notifications');
      console.log('✅ Added admin_password column to settings');
    } catch (e: any) {
      console.log(`ℹ️ admin_password migration note: ${e.message}`);
    }

    // Migrate Users table to use phone instead of email
    try {
      const [cols] = await connection.query("SHOW COLUMNS FROM users LIKE 'email'");
      if ((cols as any[]).length > 0) {
        console.log('🔄 Migrating users table: renaming email to phone');
        await connection.query("ALTER TABLE users CHANGE email phone VARCHAR(50)");
        await connection.query("ALTER TABLE users ADD UNIQUE (phone)");
      }
    } catch (e: any) {
      console.log(`ℹ️ users phone migration note: ${e.message}`);
    }

    console.log('✅ Database schema initialized successfully');

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export default {
  getPool,
  testConnection,
  initializeDatabase
};