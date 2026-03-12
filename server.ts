// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { testConnection, initializeDatabase } from './src/database';
import { supabase } from './src/supabaseClient';

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

console.log('✅ Environment variables loaded');
console.log('Supabase URL:', process.env.VITE_SUPABASE_URL ? 'Loaded ✓' : 'Missing ✗');
console.log('Supabase Anon Key:', process.env.VITE_SUPABASE_ANON_KEY ? 'Loaded ✓' : 'Missing ✗');

// Helper functions to map database snake_case to frontend camelCase
const mapProductToFrontend = (dbProduct: any) => {
  if (!dbProduct) return null;
 return {
    ...dbProduct,
    minStockLevel: dbProduct.min_stock_level,
    tags: typeof dbProduct.tags === 'string' ? JSON.parse(dbProduct.tags) : dbProduct.tags
  };
};

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
  usedCount: Number(dbCode.used_count)
});

async function startServer() {
  // Test database connection
  console.log('\n🔄 Connecting to Supabase database...');
  const dbConnected = await testConnection();
  if (!dbConnected) {
   console.error('❌ Failed to connect to Supabase database. Please check your .env configuration.');
    process.exit(1);
  }

  console.log('🔄 Initializing database schema...');
  await initializeDatabase();
  console.log('✅ Database ready!\n');

  app.use(express.json({ limit: '50mb' }));

  // ==================== AUTHENTICATION ROUTES ====================
  app.post('/api/auth/register', async (req, res) => {
   try {
     const { phone, password, name = 'User' } = req.body;
     if (!phone || !password) {
       return res.status(400).json({ error: 'Phone and PIN are required' });
      }

     const { data: existing } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

     if (existing) {
       return res.status(400).json({ error: 'User with this phone number already exists' });
      }

     const userId = `user${Date.now()}`;
     const { data, error } = await supabase
        .from('users')
        .insert({ id: userId, phone, password, name })
        .select()
        .single();

     if (error) throw error;

     const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

     if (!existingCustomer) {
        await supabase.from('customers').insert({
         id: `cust${Date.now()}`,
          name,
          email: `${phone}@placeholder.com`,
          phone,
          join_date:new Date().toISOString().split('T')[0]
        });
      }

     res.status(201).json({ user: { id: userId, phone, name } });
    } catch (error: any) {
     console.error('Registration error:', error.message);
     res.status(500).json({ error: 'Failed to register' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
   try {
     const { phone, password } = req.body;
     if (!phone || !password) {
       return res.status(400).json({ error: 'Phone and password are required' });
      }

     const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .eq('password', password)
        .maybeSingle();

     if (error || !data) {
       return res.status(401).json({ error: 'Invalid phone number or password' });
      }

     res.json({ user: { id: data.id, phone: data.phone, name: data.name } });
    } catch (error: any) {
     console.error('Login error:', error.message);
     res.status(500).json({ error: 'Failed to login' });
    }
  });

  // ==================== PRODUCTS ROUTES ====================
  app.get('/api/products', async (req, res) => {
   try {
     const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

     if (error) throw error;
     res.json((data || []).map(mapProductToFrontend));
    } catch (error: any) {
     console.error('Error fetching products:', error.message);
     res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.post('/api/products', async (req, res) => {
   try {
      let product = req.body;
     if (!product.name || !product.price) {
       return res.status(400).json({ error: 'Name and price are required' });
      }

     const { minStockLevel, ...rest } = product;
     const dbProduct: any = {
        ...rest,
        min_stock_level: minStockLevel
      };

     if (dbProduct.tags && Array.isArray(dbProduct.tags)) {
        dbProduct.tags = JSON.stringify(dbProduct.tags);
      }

     const { data, error } = await supabase
        .from('products')
        .insert(dbProduct)
        .select()
        .single();

     if (error) throw error;
     res.status(201).json({ id: data.id || product.id, ...product });
    } catch (error: any) {
     console.error('Error creating product:', error.message);
     res.status(500).json({ error: error.message || 'Failed to create product' });
    }
  });

  app.put('/api/products/:id', async (req, res) => {
   try {
     const { id } = req.params;
      let product = req.body;

     const { minStockLevel, id: bodyId, ...rest } = product;
     const dbProduct: any = {
        ...rest,
        min_stock_level: minStockLevel
      };

     if (dbProduct.tags && Array.isArray(dbProduct.tags)) {
        dbProduct.tags = JSON.stringify(dbProduct.tags);
      }

     const { data, error } = await supabase
        .from('products')
        .update(dbProduct)
        .eq('id', id)
        .select()
        .single();

     if (error) throw error;
     res.json(product);
    } catch (error: any) {
     console.error('Error updating product:', error.message);
     res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
   try {
     const { id } = req.params;
     const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

     if (error) throw error;
     res.status(204).send();
    } catch (error: any) {
     console.error('Error deleting product:', error.message);
     res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  app.get('/api/products/low-stock', async (req, res) => {
   try {
     const { data, error } = await supabase
        .from('products')
        .select('*')
        .lte('stock', 'min_stock_level');

     if (error) throw error;
     res.json((data || []).map(mapProductToFrontend));
    } catch (error: any) {
     console.error('Error fetching low stock products:', error.message);
     res.status(500).json({ error: 'Failed to fetch low stock products' });
    }
  });

  app.put('/api/products/:id/inventory', async (req, res) => {
   try {
     const { id } = req.params;
     const { stock } = req.body;
     const { data, error } = await supabase
        .from('products')
        .update({ stock })
        .eq('id', id)
        .select()
        .single();

     if (error) throw error;
     res.json(mapProductToFrontend(data));
    } catch (error: any) {
     console.error('Error updating inventory:', error.message);
     res.status(500).json({ error: 'Failed to update inventory' });
    }
  });

  // ==================== ORDERS ROUTES ====================
  app.get('/api/orders', async (req, res) => {
   try {
     const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      let query = supabase.from('orders').select('*');
     if (limit) {
        query = query.limit(limit);
      }
      query = query.order('date', { ascending: false });

     const { data, error } = await query;

     if (error) throw error;
     res.json((data || []).map(mapOrderToFrontend));
    } catch (error: any) {
     console.error('Error fetching orders:', error.message);
     res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  app.post('/api/orders', async (req, res) => {
   try {
     const order= req.body;
     const dbOrder= {
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

     const { data, error } = await supabase
        .from('orders')
        .insert(dbOrder)
        .select()
        .single();

     if (error) throw error;
     res.status(201).json(order);
    } catch (error: any) {
     console.error('Error creating order:', error.message);
     res.status(500).json({ error: 'Failed to create order' });
    }
  });

  // ==================== SETTINGS ROUTES ====================
  app.get('/api/settings', async (req, res) => {
   try {
     const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .maybeSingle();

     const settings = data || {};
     res.json({
        ...settings,
        isMaintenanceMode: !!settings.is_maintenance_mode,
        emailNotifications: !!settings.email_notifications,
       adminPassword: settings.admin_password
      });
    } catch (error: any) {
     console.error('Error fetching settings:', error.message);
     res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.put('/api/settings', async (req, res) => {
   try {
     const settings = req.body;
     const { data, error } = await supabase
        .from('settings')
        .update({
         paypack_api_key: settings.paypackApiKey || '',
         paypack_api_secret: settings.paypackApiSecret || '',
          store_name: settings.storeName || 'Vintner & Spirit',
          is_maintenance_mode: settings.isMaintenanceMode ? 1 : 0,
          email_notifications: settings.emailNotifications ? 1 : 0,
         admin_password: settings.adminPassword || 'admin123'
        })
        .eq('id', 1)
        .select()
        .single();

     if (error) throw error;
     res.json(settings);
    } catch (error: any) {
     console.error('Error updating settings:', error.message);
     res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  app.post('/api/admin/login', async (req, res) => {
   try {
     const { password } = req.body;
     const { data, error } = await supabase
        .from('settings')
        .select('admin_password')
        .limit(1)
        .maybeSingle();

     if (error || !data || data.admin_password !== password) {
       return res.status(401).json({ success: false, error: 'Incorrect password' });
      }

     res.json({ success: true });
    } catch (error: any) {
     console.error('Admin login error:', error.message);
     res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ==================== DISCOUNT CODES ROUTES ====================
  app.get('/api/discounts', async (req, res) => {
   try {
     const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false });

     if (error) throw error;
     res.json((data || []).map(mapDiscountToFrontend));
    } catch (error: any) {
     console.error('Error fetching discounts:', error.message);
     res.status(500).json({ error: 'Failed to fetch discounts' });
    }
  });

  app.get('/api/discounts/:code', async (req, res) => {
   try {
     const { code } = req.params;
     const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .ilike('code', code)
        .eq('is_active', true)
        .maybeSingle();

     if (error || !data) {
       return res.status(404).json({ error: 'Discount code not found or inactive' });
      }
     res.json(mapDiscountToFrontend(data));
    } catch (error: any) {
     console.error('Error fetching discount code:', error.message);
     res.status(500).json({ error: 'Failed to fetch discount code' });
    }
  });

  app.post('/api/discounts', async (req, res) => {
   try {
     const discountData = req.body;
     const codeName = discountData.code.toUpperCase();

     const { data: existing } = await supabase
        .from('discount_codes')
        .select('*')
        .ilike('code', codeName)
        .maybeSingle();

     if (existing) {
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

     const { data, error } = await supabase
        .from('discount_codes')
        .insert(dbCode)
        .select()
        .single();

     if (error) throw error;
     res.status(201).json(mapDiscountToFrontend(data));
    } catch (error: any) {
     console.error('Error creating discount code:', error.message);
     res.status(500).json({ error: 'Failed to create discount code' });
    }
  });

  app.delete('/api/discounts/:id', async (req, res) => {
   try {
     const { id } = req.params;
     const { error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', id);

     if (error) throw error;
     res.status(204).send();
    } catch (error: any) {
     console.error('Error deleting discount code:', error.message);
     res.status(500).json({ error: 'Failed to delete discount code' });
    }
  });

  app.put('/api/discounts/:id', async (req, res) => {
   try {
     const { id } = req.params;
     const updates = req.body;
     const { data, error } = await supabase
        .from('discount_codes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

     if (error) throw error;
     res.json(updates);
    } catch (error: any) {
     console.error('Error updating discount code:', error.message);
     res.status(500).json({ error: 'Failed to update discount code' });
    }
  });

  app.post('/api/discounts/:id/increment-usage', async (req, res) => {
   try {
     const { id } = req.params;
      
     const { data: existing } = await supabase
        .from('discount_codes')
        .select('used_count')
        .eq('id', id)
        .maybeSingle();

     if (!existing) {
       return res.status(404).json({ error: 'Discount code not found' });
      }

     const { data, error } = await supabase
        .from('discount_codes')
        .update({ used_count: (existing.used_count || 0) +1 })
        .eq('id', id)
        .select()
        .single();

     if (error) throw error;
     res.json(mapDiscountToFrontend(data));
    } catch (error: any) {
     console.error('Error incrementing usage:', error.message);
     res.status(500).json({ error: 'Failed to increment usage' });
    }
  });

  // ==================== CUSTOMERS ROUTES ====================
  app.get('/api/customers', async (req, res) => {
   try {
     const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

     if (error) throw error;
     res.json(data || []);
    } catch (error: any) {
     console.error('Error fetching customers:', error.message);
     res.status(500).json({ error: 'Failed to fetch customers' });
    }
  });

  app.get('/api/customers/:id', async (req, res) => {
   try {
     const { id } = req.params;
     const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

     if (error || !data) {
       return res.status(404).json({ error: 'Customer not found' });
      }
     res.json(data);
    } catch (error: any) {
     console.error('Error fetching customer:', error.message);
     res.status(500).json({ error: 'Failed to fetch customer' });
    }
  });

  app.get('/api/customers/email/:email', async (req, res) => {
   try {
     const { email } = req.params;
     const { data, error } = await supabase
        .from('customers')
        .select('*')
        .ilike('email', email)
        .maybeSingle();

     if (error || !data) {
       return res.status(404).json({ error: 'Customer not found' });
      }
     res.json(data);
    } catch (error: any) {
     console.error('Error fetching customer:', error.message);
     res.status(500).json({ error: 'Failed to fetch customer' });
    }
  });

  app.get('/api/customers/phone/:phone', async (req, res) => {
   try {
     const { phone } = req.params;
     const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

     if (error || !data) {
       return res.status(404).json({ error: 'Customer not found' });
      }
     res.json(data);
    } catch (error: any) {
     console.error('Error fetching customer by phone:', error.message);
     res.status(500).json({ error: 'Failed to fetch customer' });
    }
  });

  app.post('/api/customers', async (req, res) => {
   try {
     const customer= req.body;
     const newCustomer= {
       id: `cust${Date.now()}`,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
       address: customer.address,
        join_date:new Date().toISOString().split('T')[0],
        total_spent: 0,
        order_count: 0,
        loyalty_points: customer.loyaltyPoints || 0
      };

     const { data, error } = await supabase
        .from('customers')
        .insert(newCustomer)
        .select()
        .single();

     if (error) throw error;
     res.status(201).json({ id: data.id || newCustomer.id, ...newCustomer });
    } catch (error: any) {
     console.error('Error creating customer:', error.message);
     res.status(500).json({ error: 'Failed to create customer' });
    }
  });

  app.put('/api/customers/:id', async (req, res) => {
   try {
     const { id } = req.params;
     const updates = req.body;
     const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

     if (error) throw error;
     res.json(updates);
    } catch (error: any) {
     console.error('Error updating customer:', error.message);
     res.status(500).json({ error: 'Failed to update customer' });
    }
  });

  app.post('/api/customers/:id/add-points', async (req, res) => {
   try {
     const { id } = req.params;
     const { points } = req.body;

     const { data: existing } = await supabase
        .from('customers')
        .select('loyalty_points')
        .eq('id', id)
        .maybeSingle();

     if (!existing) {
       return res.status(404).json({ error: 'Customer not found' });
      }

     const newPoints = (existing.loyalty_points || 0) + points;
     const { data, error } = await supabase
        .from('customers')
        .update({ loyalty_points: newPoints })
        .eq('id', id)
        .select()
        .single();

     if (error) throw error;
     res.json(data);
    } catch (error: any) {
     console.error('Error adding points:', error.message);
     res.status(500).json({ error: 'Failed to add points' });
    }
  });

  app.post('/api/customers/:id/remove-points', async (req, res) => {
   try {
     const { id } = req.params;
     const { points } = req.body;

     const { data: existing } = await supabase
        .from('customers')
        .select('loyalty_points')
        .eq('id', id)
        .maybeSingle();

     if (!existing) {
       return res.status(404).json({ error: 'Customer not found' });
      }

     const newPoints = Math.max(0, (existing.loyalty_points || 0) - points);
     const { data, error } = await supabase
        .from('customers')
        .update({ loyalty_points: newPoints })
        .eq('id', id)
        .select()
        .single();

     if (error) throw error;
     res.json(data);
    } catch (error: any) {
     console.error('Error removing points:', error.message);
     res.status(500).json({ error: 'Failed to remove points' });
    }
  });

  // ==================== ANALYTICS ROUTE ====================
  app.get('/api/analytics', async (req, res) => {
   try {
     const { data: ordersData } = await supabase.from('orders').select('*');
     const orders = ordersData || [];
     const totalSales = orders.reduce((sum: number, order: any) => sum + Number(order.final_total || order.finalTotal || 0), 0);
     const totalOrders = orders.length;
     const averageOrderValue = totalOrders > 0 ? totalSales/ totalOrders: 0;

     const productSales: Record<string, number> = {};
      orders.forEach((order: any) => {
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

     const sortedProductIds = Object.entries(productSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([productId]) => productId);

     const topProducts: any[] = [];
      for (const productId of sortedProductIds) {
       if (!productId || productId === 'undefined') continue;
       const { data: productData } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .maybeSingle();
        
       if (productData) {
          topProducts.push(mapProductToFrontend(productData));
        }
      }

     if (topProducts.length === 0) {
       const { data: fallbackData } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        topProducts.push(...(fallbackData || []).map(mapProductToFrontend));
      }

     const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
     const monthlyRevenue = months.map(month => ({
        month,
       revenue: Math.floor(Math.random() * 5000000) + 1000000
      }));

     const customerGrowth = months.map((month) => ({
        month,
        newCustomers: Math.floor(Math.random() * 20) +5
      }));

     res.json({
        totalSales,
        totalOrders,
        averageOrderValue,
        topProducts,
        monthlyRevenue,
       customerGrowth
      });
    } catch (error: any) {
     console.error('Error fetching analytics:', error.message);
     res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // ==================== PAYPACK PAYMENT ROUTES ====================
  app.post('/api/paypack/authorize', async (req, res) => {
   const { amount, phoneNumber, provider } = req.body;

   try {
     const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .maybeSingle();

     if (!settingsData?.paypack_api_key || settingsData.paypack_api_key === '') {
       console.log('⚡ PayPack (Mock Mode): Authorizing mock payment...');
       return res.json({ success: true, transactionId: `mock-${Date.now()}` });
      }

     const auth = Buffer.from(`${settingsData.paypack_api_key}:${settingsData.paypack_api_secret}`).toString('base64');

     const response = await fetch('https://api.paypack.co.ke/v1/transactions/authorize', {
       method: 'POST',
       headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amount,
          phone: phoneNumber,
          network: provider
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
    } catch (error: any) {
     console.error('PayPack authorization error:', error.message);
     res.status(500).json({
        success: false,
       error: 'Payment service unavailable. Please try again.'
      });
    }
  });

  app.get('/api/paypack/status/:transactionId', async (req, res) => {
   const { transactionId } = req.params;

   try {
     if (transactionId.startsWith('mock-')) {
       console.log('⚡ PayPack (Mock Mode): Returning completed status for', transactionId);
       return res.json({
          success: true,
          status: 'completed',
         message: 'Mock payment completed'
        });
      }

     const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .maybeSingle();

     const auth = Buffer.from(`${settingsData.paypack_api_key}:${settingsData.paypack_api_secret}`).toString('base64');

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
          status: data.status,
         message: data.message
        });
      } else {
       res.status(response.status).json({
          success: false,
         error: data.message || 'Failed to check status'
        });
      }
    } catch (error: any) {
     console.error('PayPack status check error:', error.message);
     res.status(500).json({
        success: false,
       error: 'Unable to check transaction status'
      });
    }
  });

  // ==================== VITE MIDDLEWARE & SERVER STARTUP ====================
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
   console.log(`\n🚀 Server running on http://localhost:${PORT}`);
   console.log('📊 Full API available with Supabase backend\n');
  });
}

startServer().catch(console.error);
