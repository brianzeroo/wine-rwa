import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getPool, testConnection, initializeDatabase } from './src/database';

dotenv.config();
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  origin: string;
  abv: string;
  year?: number;
  stock: number;
  minStockLevel?: number;
  tags?: string[];
}

interface Order {
  id: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: any[];
  total: number;
  discountAmount?: number;
  finalTotal: number;
  status: string;
  date: string;
  paymentMethod: string;
  shippingAddress?: string;
  notes?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  joinDate: string;
  totalSpent: number;
  orderCount: number;
  loyaltyPoints?: number;
}

interface User {
  id: string;
  email: string;
  password: string; // In production, this should be hashed
  name: string;
  createdAt: string;
}

interface DiscountCode {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrderAmount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Test database connection and initialize schema
  console.log('🔄 Connecting to MySQL database...');
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('❌ Failed to connect to MySQL database. Please check your .env configuration.');
    console.error('Server will not start without database connection.');
    return;
  }

  console.log('🔄 Initializing database schema...');
  await initializeDatabase();
  console.log('✅ Database ready!');

  app.use(express.json({ limit: '50mb' }));

  // Helper to map DB snake_case to Frontend camelCase for Products
  const mapProductToFrontend = (dbProduct: any) => {
    if (!dbProduct) return null;
    return {
      ...dbProduct,
      minStockLevel: dbProduct.min_stock_level,
      tags: typeof dbProduct.tags === 'string' ? JSON.parse(dbProduct.tags) : dbProduct.tags
    };
  };

  // Authentication Routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { phone, password, name = 'User' } = req.body;
      if (!phone || !password) {
        return res.status(400).json({ error: 'Phone and PIN are required' });
      }

      // Check if user already exists
      const [existing] = await getPool().query('SELECT * FROM users WHERE phone = ?', [phone]);
      if ((existing as any[]).length > 0) {
        return res.status(400).json({ error: 'User with this phone number already exists' });
      }

      const userId = `user${Date.now()}`;
      await getPool().query(
        'INSERT INTO users (id, phone, password, name) VALUES (?, ?, ?, ?)',
        [userId, phone, password, name]
      );

      // Create a customer record for this user if it doesn't exist
      const [existingCustomer] = await getPool().query('SELECT * FROM customers WHERE phone = ?', [phone]);
      if ((existingCustomer as any[]).length === 0) {
        await getPool().query(
          'INSERT INTO customers (id, name, email, phone, join_date) VALUES (?, ?, ?, ?, ?)',
          [`cust${Date.now()}`, name, `${phone}@placeholder.com`, phone, new Date().toISOString().split('T')[0]]
        );
      }

      res.status(201).json({ user: { id: userId, phone, name } });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { phone, password } = req.body;
      if (!phone || !password) {
        return res.status(400).json({ error: 'Phone and password are required' });
      }

      const [rows] = await getPool().query(
        'SELECT * FROM users WHERE phone = ? AND password = ?',
        [phone, password]
      );

      if ((rows as any[]).length > 0) {
        const user = (rows as any[])[0];
        res.json({ user: { id: user.id, phone: user.phone, name: user.name } });
      } else {
        res.status(401).json({ error: 'Invalid phone number or password' });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  });

  // API Routes
  app.get('/api/products', async (req, res) => {
    try {
      const [rows] = await getPool().query('SELECT * FROM products ORDER BY name');
      res.json((rows as any[]).map(mapProductToFrontend));
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.post('/api/products', async (req, res) => {
    try {
      console.log('\n📥 POST /api/products - Received body:', JSON.stringify(req.body, null, 2));
      let product = req.body;

      // Validate required fields
      if (!product.name || !product.price) {
        return res.status(400).json({ error: 'Name and price are required' });
      }

      // Convert camelCase to snake_case for MySQL
      const { minStockLevel, ...rest } = product;
      const dbProduct = {
        ...rest,
        min_stock_level: minStockLevel
      };

      console.log('🔄 Converting to DB format:', JSON.stringify(dbProduct, null, 2));

      // Handle tags array - convert to JSON string for MySQL
      if (dbProduct.tags && Array.isArray(dbProduct.tags)) {
        dbProduct.tags = JSON.stringify(dbProduct.tags);
      }

      console.log('💾 Inserting into database...');
      const [result] = await getPool().query(
        'INSERT INTO products SET ?',
        dbProduct
      );
      console.log('✅ Product created with ID:', (result as any).insertId);
      res.status(201).json({ id: (result as any).insertId || product.id, ...product });
    } catch (error: any) {
      console.error('❌ Error creating product:', error.message);
      console.error('Full error:', error);
      res.status(500).json({ error: error.message || 'Failed to create product' });
    }
  });

  app.post('/api/products/bulk', async (req, res) => {
    try {
      const products = req.body;
      if (!Array.isArray(products)) {
        return res.status(400).json({ error: 'Data must be an array of products' });
      }

      for (const product of products) {
        const { minStockLevel, ...rest } = product;
        const dbProduct: any = {
          ...rest,
          min_stock_level: minStockLevel || 0
        };
        if (dbProduct.tags && Array.isArray(dbProduct.tags)) {
          dbProduct.tags = JSON.stringify(dbProduct.tags);
        }
        await getPool().query('INSERT INTO products SET ? ON DUPLICATE KEY UPDATE ?', [dbProduct, dbProduct]);
      }

      res.status(200).json({ message: 'Bulk upload successful' });
    } catch (error: any) {
      console.error('Error in bulk upload:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/products/:id', async (req, res) => {
    try {
      const { id } = req.params;
      let product = req.body;

      // Convert camelCase to snake_case for MySQL
      const { minStockLevel, id: bodyId, ...rest } = product;
      const dbProduct: any = {
        ...rest,
        min_stock_level: minStockLevel
      };

      // Handle tags array - convert to JSON string for MySQL
      if (dbProduct.tags && Array.isArray(dbProduct.tags)) {
        dbProduct.tags = JSON.stringify(dbProduct.tags);
      }

      await getPool().query(
        'UPDATE products SET ? WHERE id = ?',
        [dbProduct, id]
      );
      res.json(product);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await getPool().query('DELETE FROM products WHERE id = ?', [id]);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  // Helper to map DB snake_case to Frontend camelCase for Orders
  const mapOrderToFrontend = (dbOrder: any) => ({
    id: dbOrder.id,
    customerId: dbOrder.customer_id,
    customerName: dbOrder.customer_name,
    customerPhone: dbOrder.customer_phone,
    customerEmail: dbOrder.customer_email,
    items: typeof dbOrder.items === 'string' ? JSON.parse(dbOrder.items) : dbOrder.items,
    total: Number(dbOrder.total),
    discountAmount: Number(dbOrder.discount_amount || 0),
    finalTotal: Number(dbOrder.final_total),
    status: dbOrder.status,
    paymentMethod: dbOrder.payment_method,
    shippingAddress: dbOrder.shipping_address,
    notes: dbOrder.notes,
    date: dbOrder.date
  });

  app.get('/api/orders', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const query = limit
        ? 'SELECT * FROM orders ORDER BY date DESC LIMIT ?'
        : 'SELECT * FROM orders ORDER BY date DESC';
      const params = limit ? [limit] : [];
      const [rows] = await getPool().query(query, params);
      res.json((rows as any[]).map(mapOrderToFrontend));
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const order = req.body;
      // Map camelCase to snake_case for DB insertion
      const dbOrder = {
        id: order.id,
        customer_id: order.customerId || null,
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        customer_email: order.customerEmail,
        items: JSON.stringify(order.items),
        total: order.total,
        discount_amount: order.discountAmount || 0,
        final_total: order.finalTotal,
        status: order.status || 'Pending',
        payment_method: order.paymentMethod,
        shipping_address: order.shippingAddress || null,
        notes: order.notes || null
      };
      await getPool().query('INSERT INTO orders SET ?', dbOrder);
      res.status(201).json(order);
    } catch (error: any) {
      console.error('Error creating order:', error.message);
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  app.get('/api/settings', async (req, res) => {
    try {
      const [rows] = await getPool().query('SELECT * FROM settings LIMIT 1');
      const settings = (rows as any)[0] || {};
      res.json({
        ...settings,
        isMaintenanceMode: !!settings.is_maintenance_mode,
        emailNotifications: !!settings.email_notifications,
        adminPassword: settings.admin_password
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.put('/api/settings', async (req, res) => {
    try {
      const settings = req.body;
      await getPool().query(
        'UPDATE settings SET paypack_api_key = ?, paypack_api_secret = ?, store_name = ?, is_maintenance_mode = ?, email_notifications = ?, admin_password = ? WHERE id = 1',
        [
          settings.paypackApiKey || '',
          settings.paypackApiSecret || '',
          settings.storeName || 'Vintner & Spirit',
          settings.isMaintenanceMode ? 1 : 0,
          settings.emailNotifications ? 1 : 0,
          settings.adminPassword || 'admin123'
        ]
      );
      res.json(settings);
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  app.post('/api/admin/login', async (req, res) => {
    try {
      const { password } = req.body;
      const [rows] = await getPool().query('SELECT admin_password FROM settings WHERE id = 1');
      const settings = (rows as any)[0];

      if (settings && settings.admin_password === password) {
        res.json({ success: true });
      } else {
        res.status(401).json({ success: false, error: 'Incorrect password' });
      }
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Authentication Routes
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // Check if user already exists
      const [existing] = await getPool().query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if ((existing as any[]).length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Create new user
      const newUser = {
        id: `user${Date.now()}`,
        email,
        password, // In production, hash this with bcrypt
        name
      };

      await getPool().query('INSERT INTO users SET ?', newUser);

      // Generate a simple token (in production, use JWT)
      const token = Buffer.from(JSON.stringify({ id: newUser.id, email: newUser.email })).toString('base64');

      res.status(201).json({
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name
        }
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      const [rows] = await getPool().query(
        'SELECT * FROM users WHERE email = ? AND password = ?',
        [email, password]
      );

      if ((rows as any[]).length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const user = (rows as any[])[0];

      // Generate token
      const token = Buffer.from(JSON.stringify({ id: user.id, email: user.email })).toString('base64');

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.get('/api/auth/me', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = JSON.parse(Buffer.from(authHeader, 'base64').toString());
      const [rows] = await getPool().query(
        'SELECT * FROM users WHERE id = ?',
        [decoded.id]
      );

      if ((rows as any[]).length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = (rows as any[])[0];

      res.json({
        id: user.id,
        email: user.email,
        name: user.name
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  // PayPack Payment Processing
  app.post('/api/paypack/authorize', async (req, res) => {
    const { amount, phoneNumber, provider } = req.body;

    try {
      const [rows] = await getPool().query('SELECT * FROM settings LIMIT 1');
      const settings = (rows as any)[0];

      // MOCK MODE: If no API key is provided, return a mock transaction ID
      if (!settings?.paypack_api_key || settings.paypack_api_key === '') {
        console.log('⚡ PayPack (Mock Mode): Authorizing mock payment...');
        return res.json({ success: true, transactionId: `mock-${Date.now()}` });
      }

      const auth = Buffer.from(`${settings.paypack_api_key}:${settings.paypack_api_secret}`).toString('base64');

      const response = await fetch('https://api.paypack.co.ke/v1/transactions/authorize', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amount,
          phone: phoneNumber,
          network: provider // 'mtn' or 'airtel'
        })
      });

      const data = await response.json();

      if (response.ok) {
        res.json({ success: true, transactionId: data.transaction_id });
      } else {
        res.status(response.status).json({
          success: false,
          error: data.message || 'Payment authorization failed'
        });
      }
    } catch (error) {
      console.error('PayPack authorization error:', error);
      res.status(500).json({
        success: false,
        error: 'Payment service unavailable. Please try again.'
      });
    }
  });

  // PayPack Transaction Status Check
  app.get('/api/paypack/status/:transactionId', async (req, res) => {
    const { transactionId } = req.params;

    try {
      // MOCK MODE: Handle mock transaction IDs
      if (transactionId.startsWith('mock-')) {
        console.log('⚡ PayPack (Mock Mode): Returning completed status for', transactionId);
        return res.json({
          success: true,
          status: 'completed',
          message: 'Mock payment completed'
        });
      }

      const [rows] = await getPool().query('SELECT * FROM settings LIMIT 1');
      const settings = (rows as any)[0];
      const auth = Buffer.from(`${settings.paypack_api_key}:${settings.paypack_api_secret}`).toString('base64');

      const response = await fetch(`https://api.paypack.co.ke/v1/transactions/${transactionId}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        res.json({
          success: true,
          status: data.status, // 'pending', 'completed', 'failed'
          message: data.message
        });
      } else {
        res.status(response.status).json({
          success: false,
          error: data.message || 'Failed to check status'
        });
      }
    } catch (error) {
      console.error('PayPack status check error:', error);
      res.status(500).json({
        success: false,
        error: 'Unable to check transaction status'
      });
    }
  });

  // Helper to map DB snake_case to Frontend camelCase for Discounts
  const mapDiscountToFrontend = (dbCode: any) => ({
    id: dbCode.id,
    code: dbCode.code,
    type: dbCode.type,
    value: Number(dbCode.value),
    minOrderAmount: Number(dbCode.min_order_amount),
    startDate: dbCode.start_date,
    endDate: dbCode.end_date,
    isActive: Boolean(dbCode.is_active),
    usageLimit: dbCode.usage_limit,
    usedCount: dbCode.used_count,
    createdAt: dbCode.created_at,
    updatedAt: dbCode.updated_at
  });

  // Discount Codes API Routes
  app.get('/api/discounts', async (req, res) => {
    try {
      const [rows] = await getPool().query('SELECT * FROM discount_codes ORDER BY created_at DESC');
      res.json((rows as any[]).map(mapDiscountToFrontend));
    } catch (error) {
      console.error('Error fetching discounts:', error);
      res.status(500).json({ error: 'Failed to fetch discounts' });
    }
  });

  app.get('/api/discounts/:code', async (req, res) => {
    try {
      const { code } = req.params;
      const [rows] = await getPool().query(
        'SELECT * FROM discount_codes WHERE LOWER(code) = LOWER(?) AND is_active = 1',
        [code]
      );
      if ((rows as any[]).length > 0) {
        res.json(mapDiscountToFrontend((rows as any[])[0]));
      } else {
        res.status(404).json({ error: 'Discount code not found or inactive' });
      }
    } catch (error) {
      console.error('Error fetching discount code:', error);
      res.status(500).json({ error: 'Failed to fetch discount code' });
    }
  });

  app.post('/api/discounts', async (req, res) => {
    try {
      const discountData = req.body;
      const codeName = discountData.code.toUpperCase();

      // Check if code already exists
      const [existing] = await getPool().query(
        'SELECT * FROM discount_codes WHERE LOWER(code) = LOWER(?)',
        [codeName]
      );

      if ((existing as any[]).length > 0) {
        return res.status(400).json({ error: 'Discount code already exists' });
      }

      const dbCode = {
        id: `disc${Date.now()}`,
        code: codeName,
        type: discountData.type,
        value: discountData.value,
        min_order_amount: discountData.minOrderAmount || 0,
        start_date: discountData.startDate,
        end_date: discountData.endDate,
        is_active: discountData.isActive !== undefined ? discountData.isActive : true,
        usage_limit: discountData.usageLimit || 0,
        used_count: 0
      };

      await getPool().query(
        'INSERT INTO discount_codes SET ?',
        dbCode
      );
      res.status(201).json(mapDiscountToFrontend(dbCode));
    } catch (error) {
      console.error('Error creating discount code:', error);
      res.status(500).json({ error: 'Failed to create discount code' });
    }
  });

  app.delete('/api/discounts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await getPool().query('DELETE FROM discount_codes WHERE id = ?', [id]);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting discount code:', error);
      res.status(500).json({ error: 'Failed to delete discount code' });
    }
  });

  app.put('/api/discounts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      await getPool().query(
        'UPDATE discount_codes SET ? WHERE id = ?',
        [updates, id]
      );
      res.json(updates);
    } catch (error) {
      console.error('Error updating discount code:', error);
      res.status(500).json({ error: 'Failed to update discount code' });
    }
  });

  app.post('/api/discounts/:id/increment-usage', async (req, res) => {
    try {
      const { id } = req.params;
      await getPool().query(
        'UPDATE discount_codes SET used_count = used_count + 1 WHERE id = ?',
        [id]
      );
      const [rows] = await getPool().query(
        'SELECT * FROM discount_codes WHERE id = ?',
        [id]
      );
      res.json(mapDiscountToFrontend((rows as any[])[0]));
    } catch (error) {
      console.error('Error incrementing usage:', error);
      res.status(500).json({ error: 'Failed to increment usage' });
    }
  });

  // Customers API Routes
  app.get('/api/customers', async (req, res) => {
    try {
      const [rows] = await getPool().query('SELECT * FROM customers ORDER BY name');
      res.json(rows);
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  });

  app.get('/api/customers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await getPool().query(
        'SELECT * FROM customers WHERE id = ?',
        [id]
      );
      if ((rows as any[]).length > 0) {
        res.json((rows as any[])[0]);
      } else {
        res.status(404).json({ error: 'Customer not found' });
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      res.status(500).json({ error: 'Failed to fetch customer' });
    }
  });

  app.get('/api/customers/email/:email', async (req, res) => {
    try {
      const { email } = req.params;
      const [rows] = await getPool().query(
        'SELECT * FROM customers WHERE email = ?',
        [email]
      );
      if ((rows as any[]).length > 0) {
        res.json((rows as any[])[0]);
      } else {
        res.status(404).json({ error: 'Customer not found' });
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      res.status(500).json({ error: 'Failed to fetch customer' });
    }
  });

  app.get('/api/customers/phone/:phone', async (req, res) => {
    try {
      const { phone } = req.params;
      const [rows] = await getPool().query(
        'SELECT * FROM customers WHERE phone = ?',
        [phone]
      );
      if ((rows as any[]).length > 0) {
        res.json((rows as any[])[0]);
      } else {
        res.status(404).json({ error: 'Customer not found' });
      }
    } catch (error) {
      console.error('Error fetching customer by phone:', error);
      res.status(500).json({ error: 'Failed to fetch customer' });
    }
  });

  app.post('/api/customers', async (req, res) => {
    try {
      const customer = req.body;
      const newCustomer = {
        ...customer,
        id: `cust${Date.now()}`,
        join_date: new Date().toISOString().split('T')[0],
        total_spent: 0,
        order_count: 0
      };
      const [result] = await getPool().query(
        'INSERT INTO customers SET ?',
        newCustomer
      );
      res.status(201).json({ id: (result as any).insertId || newCustomer.id, ...newCustomer });
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({ error: 'Failed to create customer' });
    }
  });

  app.put('/api/customers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      await getPool().query(
        'UPDATE customers SET ? WHERE id = ?',
        [updates, id]
      );
      res.json(updates);
    } catch (error) {
      console.error('Error updating customer:', error);
      res.status(500).json({ error: 'Failed to update customer' });
    }
  });

  app.post('/api/customers/:id/add-points', async (req, res) => {
    try {
      const { id } = req.params;
      const { points } = req.body;
      await getPool().query(
        'UPDATE customers SET loyalty_points = loyalty_points + ?, total_spent = total_spent + ? WHERE id = ?',
        [points, points, id]
      );
      const [rows] = await getPool().query(
        'SELECT * FROM customers WHERE id = ?',
        [id]
      );
      res.json((rows as any[])[0]);
    } catch (error) {
      console.error('Error adding points:', error);
      res.status(500).json({ error: 'Failed to add points' });
    }
  });

  app.post('/api/customers/:id/remove-points', async (req, res) => {
    try {
      const { id } = req.params;
      const { points } = req.body;
      await getPool().query(
        'UPDATE customers SET loyalty_points = GREATEST(0, loyalty_points - ?) WHERE id = ?',
        [points, id]
      );
      const [rows] = await getPool().query(
        'SELECT * FROM customers WHERE id = ?',
        [id]
      );
      res.json((rows as any[])[0]);
    } catch (error) {
      console.error('Error removing points:', error);
      res.status(500).json({ error: 'Failed to remove points' });
    }
  });

  // Analytics API Route
  app.get('/api/analytics', async (req, res) => {
    try {
      // Calculate total sales from orders
      const [ordersRows] = await getPool().query('SELECT * FROM orders');
      const orders = ordersRows as any[];
      const totalSales = orders.reduce((sum, order) => sum + Number(order.final_total || order.finalTotal || 0), 0);

      // Calculate total orders
      const totalOrders = orders.length;

      // Calculate average order value
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // Get top selling products
      const productSales: Record<string, number> = {};

      orders.forEach(order => {
        let items: any[] = [];
        try {
          if (typeof order.items === 'string') {
            items = JSON.parse(order.items || '[]');
          } else if (Array.isArray(order.items)) {
            items = order.items;
          }
        } catch (e) {
          console.warn(`Could not parse items for order ${order.id}`);
        }

        items.forEach((item: any) => {
          if (!productSales[item.id]) {
            productSales[item.id] = 0;
          }
          productSales[item.id] += item.quantity || 1;
        });
      });

      // Sort products by sales quantity and get top 5
      const sortedProductIds = Object.entries(productSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([productId]) => productId);

      // Fetch top products from database
      const topProducts: any[] = [];
      for (const productId of sortedProductIds) {
        if (!productId || productId === 'undefined') continue;
        const [rows] = await getPool().query(
          'SELECT * FROM products WHERE id = ?',
          [productId]
        );
        if ((rows as any[]).length > 0) {
          topProducts.push(mapProductToFrontend((rows as any[])[0]));
        }
      }

      // Fallback: If no valid top products found (e.g. new store), show recent products
      if (topProducts.length === 0) {
        const [fallbackRows] = await getPool().query('SELECT * FROM products ORDER BY created_at DESC LIMIT 5');
        topProducts.push(...(fallbackRows as any[]).map(mapProductToFrontend));
      }

      // Generate monthly revenue data (last 6 months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const monthlyRevenue = months.map(month => ({
        month,
        revenue: Math.floor(Math.random() * 5000000) + 1000000 // Random revenue for demo
      }));

      // Generate customer growth data (last 6 months)
      const customerGrowth = months.map((month, index) => ({
        month,
        newCustomers: Math.floor(Math.random() * 20) + 5 // Random new customers for demo
      }));

      const analyticsData = {
        totalSales,
        totalOrders,
        averageOrderValue,
        topProducts,
        monthlyRevenue,
        customerGrowth
      };

      res.json(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // Bulk Product Management
  app.post('/api/products/bulk', async (req, res) => {
    try {
      const products = req.body;
      for (const product of products) {
        // Check if product already exists
        const [existing] = await getPool().query(
          'SELECT * FROM products WHERE id = ?',
          [product.id]
        );

        if ((existing as any[]).length > 0) {
          // Update existing product
          await getPool().query(
            'UPDATE products SET ? WHERE id = ?',
            [product, product.id]
          );
        } else {
          // Add new product
          await getPool().query(
            'INSERT INTO products SET ?',
            product
          );
        }
      }
      res.status(201).json({ message: `${products.length} products processed` });
    } catch (error) {
      console.error('Error processing bulk products:', error);
      res.status(500).json({ error: 'Failed to process bulk products' });
    }
  });

  // Low Stock Products
  app.get('/api/products/low-stock', async (req, res) => {
    try {
      const [rows] = await getPool().query(
        'SELECT * FROM products WHERE stock <= min_stock_level'
      );
      res.json(rows);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      res.status(500).json({ error: 'Failed to fetch low stock products' });
    }
  });

  // Inventory Update
  app.put('/api/products/:id/inventory', async (req, res) => {
    try {
      const { id } = req.params;
      const { stock } = req.body;
      await getPool().query(
        'UPDATE products SET stock = ? WHERE id = ?',
        [stock, id]
      );
      const [rows] = await getPool().query(
        'SELECT * FROM products WHERE id = ?',
        [id]
      );
      res.json(mapProductToFrontend((rows as any[])[0]));
    } catch (error) {
      console.error('Error updating inventory:', error);
      res.status(500).json({ error: 'Failed to update inventory' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
